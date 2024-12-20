// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  // Get the upsell discount cart attribute
  const upsellDiscount = input.cart.upsellDiscount?.value;

  // Create targets for the upsell discount based on their attribute
  const targets = [];
  input.cart.lines.forEach((line) => {
    if (line.upsellProduct?.value === "true") {
      targets.push({
        cartLine: {
          id: line.id
        }
      });
    }
  });

  // Create discount for targets
  if (targets.length) {
    return {
      discounts: [
        {
          targets: targets,
          value: {
            percentage: {
              value: upsellDiscount
            }
          }
        }
      ],
      discountApplicationStrategy: DiscountApplicationStrategy.First,
    };
  }

  return EMPTY_DISCOUNT;
}