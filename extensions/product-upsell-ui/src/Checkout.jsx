import {
  reactExtension,
  useAppMetafields,
  useCartLines,
  useApi,
  Text,
  InlineLayout,
  BlockLayout,
  ProductThumbnail,
  Button,
  Modal,
  Image,
  BlockStack,
  Select,
  Heading,
  useApplyCartLinesChange,
  useSettings,
  useApplyAttributeChange
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {

  // GraphQL API query
  const { query } = useApi();

  // Get app metafields
  let metafields = useAppMetafields({
    namespace: "custom",
    key: "product_upsell",
    type: "product"
  });

  // Get cart line items
  const cartLines = useCartLines();
  
  const settings = useSettings();
  const applyAttributeChange = useApplyAttributeChange()

  // Local states
  const [upsellProducts, setUpsellProducts] = useState([]);
  const [metafieldsLoaded, setMetafieldsLoaded] = useState(false);

  // Apply attribute change to cart
  useEffect(() => {
    const createDiscountAttribute = async () => {
      await applyAttributeChange({
        key: "_upsellDiscount",
        type: "updateAttribute",
        value: `${settings.upsell_discount || 10}`
      });
      await applyAttributeChange({
        key: "_upsellBundleDiscount",
        type: "updateAttribute",
        value: `${settings.upsell_bundle_discount || 75}`
      });
    }
    createDiscountAttribute();
  }, [])

  // Set metafields loaded to true when app metafields are loaded
  useEffect(() => {
    if (metafields.length > 0) {
      setMetafieldsLoaded(true);
    }
  }, [metafields])

  // Show upsell products whenever cart lines change
  useEffect(() => {
    // Filter metafields by removing ones where the value exists in cart
    const filteredMetafields = metafields.filter(field => {
      const found = cartLines.find(item => item.merchandise.product.id === field.metafield.value);
      if (found) {
        return false;
      }
      return true
    });
    
    // Fetch details of products in filteredMetafield
    filteredMetafields.forEach(field => {
      if (field.metafield.value) {
        fetchProduct(field.metafield.value);
      }
    });

    console.log(filteredMetafields);
  }, [metafieldsLoaded])

  // Fetch product details
  async function fetchProduct(productId) {
    try {
      const { data } = await query(
        `query ($id: ID!) {
          product (id: $id) {
            id
            title
            featuredImage {
              url
            }
            selectedOrFirstAvailableVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              image {
                url
              }
            }
            variants (first: 10) {
              nodes {
                id
                title
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                }
              }
            }
          }
        }`,
        {
          variables: {id: productId}
        }
      );
      console.log(data);
      setUpsellProducts(state => {
        return [...state, data]
      });
    }
    catch (error) {
      console.log(error);
    }
  }

  if (upsellProducts.length === 0) {
    return null
  }
  return (
    <>
      <Heading level={2}>You may also like</Heading>
      {upsellProducts.map((item, index) =>
        <UpsellProduct product={item.product} key={index} index={index} />
      )}
    </>
  )
}

function UpsellProduct({ product, index }) {

  // Shopify hooks
  const applyCartLineChange = useApplyCartLinesChange();

  const { ui } = useApi();

  const [selectedVariant, setSelectedVariant] = useState(product.selectedOrFirstAvailableVariant);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // Event handlers
  const handleVariantChange = (value) => {
    setSelectedVariant(product.variants.nodes.find(variant => variant.id === value));
  }
  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await applyCartLineChange({
        merchandiseId: selectedVariant.id,
        type: "addCartLine",
        attributes: [
          {
            key: "_upsellProduct",
            value: "true"
          },
        ],
        quantity: 1
      });
      setIsAddingToCart(false);
      setIsAddedToCart(true)
      ui.overlay.close(`product-modal-${index}`)
    }
    catch (error) {
      console.log(error);
      setIsAddingToCart(false);
    }
  }

  // Create options array for select element
  const options = product.variants.nodes.map(variant => ({
    value: variant.id,
    label: variant.title,
  }))

  // If already added to cart then don't show it
  if (isAddedToCart) {
    return null;
  }
  return (
    <InlineLayout columns={["auto", "fill", "auto"]} spacing="base" blockAlignment="center" padding="base">
      <ProductThumbnail source={product.featuredImage.url} />
      <BlockLayout>
        <Text>{product.title}</Text>
        <Text>{product.selectedOrFirstAvailableVariant.price.currencyCode} {product.selectedOrFirstAvailableVariant.price.amount}</Text>
      </BlockLayout>
      <Button
        overlay={
        <Modal padding="base" id={"product-modal-" + index}>
          <InlineLayout spacing="base">
            <Image source={selectedVariant.image.url} />
            <BlockLayout rows={["auto", "auto", "auto"]} spacing="base">
              <Heading level={1}>{product.title}</Heading>
              <Text>{selectedVariant.price.currencyCode} {selectedVariant.price.amount}</Text>
              <BlockStack />
              <Select
                label="Select Variant"
                value={selectedVariant.id}
                onChange={handleVariantChange}
                options={options}
              />
              <Button onPress={handleAddToCart} loading={isAddingToCart}>Add to cart</Button>
            </BlockLayout>
          </InlineLayout>
        </Modal>    
      }
      >
        Add
      </Button>
    </InlineLayout>
  )
}