import logging
import uuid
from datetime import date, timedelta
from decimal import Decimal

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import (
    AIAnalysisLog,
    Anomaly,
    Interaction,
    InteractionStatus,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    Quote,
    SourceType,
)
from services.ai_service import AIService
from services.anomaly_service import detect_anomalies

logger = logging.getLogger(__name__)

# Module-level flag for the one-time startup warning about missing safety key.
_safety_key_warned: bool = False


class ContentSafetyError(Exception):
    """Raised when content fails safety verification in strict mode."""


class OrderOrchestrator:
    """Coordinates the full ingest-to-order pipeline.

    Each public method expects a caller-supplied session and manages the
    transaction boundary itself (commit on success, rollback on failure).
    """

    def __init__(self) -> None:
        self.ai = AIService()
        self._warn_missing_safety_key()

    @staticmethod
    def _warn_missing_safety_key() -> None:
        global _safety_key_warned
        if _safety_key_warned:
            return
        _safety_key_warned = True
        safety_mode = settings.SAFETY_MODE
        if not settings.WHITE_CIRCLE_API_KEY and safety_mode != "off":
            logger.warning(
                "WHITE_CIRCLE_API_KEY is not set and SAFETY_MODE=%s. "
                "Content safety checks will be skipped until a key is provided.",
                safety_mode,
            )

    # ------------------------------------------------------------------
    # Text-based pipeline (transcription done on frontend)
    # ------------------------------------------------------------------
    async def process_text(
        self,
        *,
        tenant_id: uuid.UUID,
        customer_id: uuid.UUID,
        transcript: str,
        source_type: SourceType,
        session: AsyncSession,
    ) -> dict:
        """Pipeline for pre-transcribed text: safety -> extract -> order."""
        try:
            # 1. Persist interaction
            interaction = Interaction(
                tenant_id=tenant_id,
                customer_id=customer_id,
                source_type=source_type,
                raw_asset_url=None,
                status=InteractionStatus.PENDING,
            )
            session.add(interaction)
            await session.flush()

            # 2. Content safety check
            safety_verdict = await self._run_safety_check(transcript)

            # 3. Extract structured order data via LLM
            extracted_items = await self.ai.extract_order_data(transcript)

            # 4. Persist AI analysis log
            analysis_log = AIAnalysisLog(
                interaction_id=interaction.id,
                transcript_text=transcript,
                raw_extraction_json={
                    "extracted_items": extracted_items,
                    "safety_verdict": safety_verdict,
                },
                confidence_score=Decimal("0.9200"),
            )
            session.add(analysis_log)

            # 5. Resolve SKUs and build order
            order, order_item_objects, anomalies = await self._build_order(
                tenant_id=tenant_id,
                customer_id=customer_id,
                interaction_id=interaction.id,
                extracted_items=extracted_items,
                session=session,
            )

            # 6. Generate quote
            quote = self._generate_quote(order)
            session.add(quote)

            # 7. Finalize
            interaction.status = InteractionStatus.PROCESSED
            await session.commit()

            logger.info(
                "Interaction %s processed -> order %s (%d items, %d anomalies, quote %s)",
                interaction.id,
                order.id,
                len(order_item_objects),
                len(anomalies),
                quote.id,
            )

            return {
                "interaction_id": interaction.id,
                "order_id": order.id,
                "status": order.status.value,
                "anomalies_detected": len(anomalies),
            }

        except ContentSafetyError:
            await session.rollback()
            try:
                if interaction.id is not None:  # type: ignore[possibly-undefined]
                    interaction.status = InteractionStatus.FAILED
                    await session.commit()
            except Exception:
                await session.rollback()
            raise

        except Exception:
            await session.rollback()
            try:
                if interaction.id is not None:  # type: ignore[possibly-undefined]
                    interaction.status = InteractionStatus.FAILED
                    await session.commit()
            except Exception:
                await session.rollback()
            logger.exception("Failed to process interaction")
            raise

    # ------------------------------------------------------------------
    # File-based pipeline (legacy — includes transcription)
    # ------------------------------------------------------------------
    async def process_incoming_interaction(
        self,
        *,
        tenant_id: uuid.UUID,
        customer_id: uuid.UUID,
        file: UploadFile,
        source_type: SourceType,
        session: AsyncSession,
    ) -> dict:
        """End-to-end pipeline: ingest -> transcribe -> safety -> extract -> order."""
        try:
            interaction = Interaction(
                tenant_id=tenant_id,
                customer_id=customer_id,
                source_type=source_type,
                raw_asset_url=file.filename,
                status=InteractionStatus.PENDING,
            )
            session.add(interaction)
            await session.flush()

            # Transcribe
            transcript = await self.ai.transcribe_audio(
                file_url=file.filename or ""
            )

            # Safety check
            safety_verdict = await self._run_safety_check(transcript)

            # Extract
            extracted_items = await self.ai.extract_order_data(transcript)

            # AI log
            analysis_log = AIAnalysisLog(
                interaction_id=interaction.id,
                transcript_text=transcript,
                raw_extraction_json={
                    "extracted_items": extracted_items,
                    "safety_verdict": safety_verdict,
                },
                confidence_score=Decimal("0.9200"),
            )
            session.add(analysis_log)

            # Build order
            order, order_item_objects, anomalies = await self._build_order(
                tenant_id=tenant_id,
                customer_id=customer_id,
                interaction_id=interaction.id,
                extracted_items=extracted_items,
                session=session,
            )

            # Generate quote
            quote = self._generate_quote(order)
            session.add(quote)

            interaction.status = InteractionStatus.PROCESSED
            await session.commit()

            logger.info(
                "Interaction %s processed -> order %s (%d items, %d anomalies)",
                interaction.id,
                order.id,
                len(order_item_objects),
                len(anomalies),
            )

            return {
                "interaction_id": interaction.id,
                "order_id": order.id,
                "status": order.status.value,
                "anomalies_detected": len(anomalies),
            }

        except ContentSafetyError:
            await session.rollback()
            try:
                if interaction.id is not None:  # type: ignore[possibly-undefined]
                    interaction.status = InteractionStatus.FAILED
                    await session.commit()
            except Exception:
                await session.rollback()
            raise

        except Exception:
            await session.rollback()
            try:
                if interaction.id is not None:  # type: ignore[possibly-undefined]
                    interaction.status = InteractionStatus.FAILED
                    await session.commit()
            except Exception:
                await session.rollback()
            logger.exception("Failed to process interaction")
            raise

    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------
    async def _run_safety_check(self, transcript: str) -> dict | None:
        """Run content safety check based on SAFETY_MODE config."""
        safety_verdict: dict | None = None
        safety_mode = settings.SAFETY_MODE

        if safety_mode == "off":
            logger.debug("Content safety check skipped (SAFETY_MODE=off)")
        elif not settings.WHITE_CIRCLE_API_KEY:
            logger.debug("Content safety check skipped — WHITE_CIRCLE_API_KEY not set")
        else:
            safety_result = await self.ai.verify_content_safety(transcript)
            safety_verdict = safety_result
            is_unsafe = safety_result.get("decision") == "block"

            if safety_mode == "strict" and is_unsafe:
                reason = safety_result.get("reason", "unsafe content detected")
                logger.warning(
                    "Content safety BLOCKED interaction (strict mode): %s", reason
                )
                raise ContentSafetyError(
                    f"Content blocked by safety policy: {reason}"
                )
            elif is_unsafe:
                logger.warning(
                    "Content safety flagged interaction (log mode): %s",
                    safety_result.get("reason", "no reason provided"),
                )

        return safety_verdict

    async def _build_order(
        self,
        *,
        tenant_id: uuid.UUID,
        customer_id: uuid.UUID,
        interaction_id: uuid.UUID,
        extracted_items: list[dict],
        session: AsyncSession,
    ) -> tuple[Order, list[OrderItem], list[Anomaly]]:
        """Resolve SKUs, create Order + OrderItems, run anomaly detection."""
        skus = [item["sku"] for item in extracted_items]
        result = await session.execute(
            select(Product).where(
                Product.tenant_id == tenant_id,
                Product.sku.in_(skus),
            )
        )
        product_map: dict[str, Product] = {
            p.sku: p for p in result.scalars().all()
        }

        order = Order(
            tenant_id=tenant_id,
            customer_id=customer_id,
            interaction_id=interaction_id,
            status=OrderStatus.DRAFT,
            total_amount=Decimal("0"),
        )
        session.add(order)
        await session.flush()

        total = Decimal("0")
        order_item_objects: list[OrderItem] = []
        unknown_sku_anomalies: list[Anomaly] = []

        for raw in extracted_items:
            product = product_map.get(raw["sku"])
            if product is None:
                logger.warning(
                    "SKU %s not found for tenant %s — flagging as anomaly",
                    raw["sku"],
                    tenant_id,
                )
                unknown_sku_anomalies.append(
                    Anomaly(
                        order_id=order.id,
                        rule_code="UNKNOWN_SKU",
                        description=(
                            f"SKU '{raw['sku']}' (qty {raw.get('qty', '?')}) "
                            f"not found in product catalog"
                        ),
                        severity_score=Decimal("7.00"),
                        is_resolved=False,
                    )
                )
                continue

            qty = int(raw["qty"])
            unit_price = product.price
            line_total = unit_price * qty
            total += line_total

            oi = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=unit_price,
            )
            session.add(oi)
            order_item_objects.append(oi)

        order.total_amount = total

        # Rule-based anomaly detection
        anomalies = detect_anomalies(order.id, order_item_objects)
        anomalies.extend(unknown_sku_anomalies)

        if anomalies:
            order.status = OrderStatus.FLAGGED
            for a in anomalies:
                session.add(a)

        return order, order_item_objects, anomalies

    @staticmethod
    def _generate_quote(order: Order) -> Quote:
        """Create a Quote for the given order, valid for 30 days."""
        return Quote(
            order_id=order.id,
            quote_amount=order.total_amount,
            valid_until=date.today() + timedelta(days=30),
        )
