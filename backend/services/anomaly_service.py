import logging
import uuid
from collections import Counter
from decimal import Decimal

from models import Anomaly, OrderItem

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Thresholds (could later live in a config table per-tenant)
# ---------------------------------------------------------------------------
MAX_REASONABLE_QUANTITY = 10_000
MAX_ORDER_VALUE = Decimal("500_000")


def detect_anomalies(
    order_id: uuid.UUID,
    order_items: list[OrderItem],
) -> list[Anomaly]:
    """Run rule-based anomaly checks against a set of order items.

    Returns a list of *transient* Anomaly ORM objects (not yet flushed).
    """
    anomalies: list[Anomaly] = []

    for item in order_items:
        # Rule 1 — Unusual volume
        if item.quantity > MAX_REASONABLE_QUANTITY:
            logger.warning(
                "Anomaly: item %s has quantity %d (> %d)",
                item.product_id,
                item.quantity,
                MAX_REASONABLE_QUANTITY,
            )
            anomalies.append(
                Anomaly(
                    order_id=order_id,
                    rule_code="UNUSUAL_VOLUME",
                    description=(
                        f"Quantity {item.quantity} for product {item.product_id} "
                        f"exceeds threshold of {MAX_REASONABLE_QUANTITY}"
                    ),
                    severity_score=Decimal("8.00"),
                    is_resolved=False,
                )
            )

        # Rule 2 — Missing / zero price
        if item.unit_price is None or item.unit_price <= 0:
            logger.warning(
                "Anomaly: item %s has zero/missing price", item.product_id
            )
            anomalies.append(
                Anomaly(
                    order_id=order_id,
                    rule_code="ZERO_PRICE",
                    description=(
                        f"Unit price is {item.unit_price} for product {item.product_id}"
                    ),
                    severity_score=Decimal("6.50"),
                    is_resolved=False,
                )
            )

        # Rule 3 — Negative or zero quantity
        if item.quantity <= 0:
            logger.warning(
                "Anomaly: item %s has non-positive quantity %d",
                item.product_id,
                item.quantity,
            )
            anomalies.append(
                Anomaly(
                    order_id=order_id,
                    rule_code="INVALID_QUANTITY",
                    description=(
                        f"Quantity {item.quantity} for product {item.product_id} "
                        f"is zero or negative"
                    ),
                    severity_score=Decimal("7.00"),
                    is_resolved=False,
                )
            )

    # Rule 4 — Duplicate product IDs in the same order
    product_counts = Counter(item.product_id for item in order_items)
    for product_id, count in product_counts.items():
        if count > 1:
            logger.warning(
                "Anomaly: product %s appears %d times in order %s",
                product_id,
                count,
                order_id,
            )
            anomalies.append(
                Anomaly(
                    order_id=order_id,
                    rule_code="DUPLICATE_PRODUCT",
                    description=(
                        f"Product {product_id} appears {count} times in the "
                        f"same order — lines should be consolidated"
                    ),
                    severity_score=Decimal("5.00"),
                    is_resolved=False,
                )
            )

    # Rule 5 — High order value
    order_total = sum(
        (item.unit_price or Decimal("0")) * item.quantity
        for item in order_items
    )
    if order_total > MAX_ORDER_VALUE:
        logger.warning(
            "Anomaly: order %s total %s exceeds threshold %s",
            order_id,
            order_total,
            MAX_ORDER_VALUE,
        )
        anomalies.append(
            Anomaly(
                order_id=order_id,
                rule_code="HIGH_ORDER_VALUE",
                description=(
                    f"Order total {order_total} exceeds threshold of "
                    f"{MAX_ORDER_VALUE}"
                ),
                severity_score=Decimal("7.50"),
                is_resolved=False,
            )
        )

    return anomalies
