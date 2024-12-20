// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {

  const bundleDiscount = input.cart.upsellBundleDiscount?.value;

  // Iterate over cart lines, check if there are more than 3 upsell products in the cart
  let count = 0;
  input.cart.lines.forEach((line) => {
    if (line.upsellProduct?.value === "true") {
      count++;
    }
  });

  // If there are more than 3 upsell products in the cart, then combine them in a bundle and apply a discount
  if (count >= 3) {
    const cartLines = [];
    input.cart.lines.forEach((line) => {
      if (line.upsellProduct?.value === "true") {
        cartLines.push({
          "cartLineId": line.id,
          "quantity": line.quantity
        });
      }
    });
    return {
      operations: [
        {
          merge: {
            cartLines: cartLines,
            parentVariantId: "gid://shopify/ProductVariant/46136584732894",
            price: {
              percentageDecrease: {
                value: bundleDiscount
              }
            },
            title: `Upsell Bundle ${bundleDiscount}% off`
          }
        } 
      ]
    };
  }

  return NO_CHANGES;
};