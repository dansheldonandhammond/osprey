document.addEventListener('DOMContentLoaded', function () {
    const variantDataScript = document.getElementById('variant-metafield-data');
    const productJsonScript = document.getElementById('product-json');
    const variantThumbnailsWrapper = document.querySelector('[data-variant-thumbnails]');
    const swatchInputs = document.querySelectorAll('.swatch-input__input');
    const addToCartButton = document.querySelector('button[name="add"]');
  
    if (!variantDataScript || !productJsonScript || !variantThumbnailsWrapper || swatchInputs.length === 0 || !addToCartButton) {
      console.warn('❌ Missing one or more required elements.');
      return;
    }
  
    // ✅ Updated: new JSON structure includes gallery + featured_image
    const variantMetafieldData = JSON.parse(variantDataScript.textContent);
    const productData = JSON.parse(productJsonScript.textContent);
    const variantIdMap = {};
    const variantAvailabilityMap = {};
  
    productData.variants.forEach((variant) => {
      if (variant.option1 && variant.id) {
        const variantId = variant.id.toString();
        variantIdMap[variant.option1] = variantId;
        variantAvailabilityMap[variantId] = variant.available;
      }
    });
  
    console.log('🗺️ Built variantIdMap:', variantIdMap);
  
    swatchInputs.forEach((input) => {
      input.addEventListener('change', function () {
        const color = input.value;
        console.log(`🎨 Swatch selected: ${color}`);
  
        const variantId = variantIdMap[color];
        console.log(`🔍 Mapped variant ID: ${variantId}`);
  
        if (variantId && variantAvailabilityMap[variantId]) {
          addToCartButton.removeAttribute('disabled');
          console.log('✅ Variant available – enabled Add to Cart button.');
        } else {
          addToCartButton.setAttribute('disabled', 'disabled');
          console.warn('❌ Variant unavailable – disabled Add to Cart button.');
        }
  
        // ✅ Updated: support new data structure
        const variantData = variantMetafieldData[variantId];
        let images = variantData?.gallery;
  
        // ✅ Fallback to featured_image if gallery is missing or empty
        if (!images || images.length === 0) {
          const fallback = variantData?.featured_image;
          if (!fallback) {
            console.warn(`⚠️ No images found for variant ${color} and no fallback image.`);
            return;
          }
          console.log('↩️ No metafield images – using featured image as fallback.');
          images = [fallback];
        }
  
        console.log(`🖼️ Rendering ${images.length} image(s)`);
  
        variantThumbnailsWrapper.innerHTML = images
          .map((img, index) => {
            return `
              <li
                id="Slide-Thumbnails-${img.sectionId}-variant-${index + 1}"
                class="thumbnail-list__item slider__slide thumbnail-list_item--variant"
                data-target="${img.sectionId}-${img.id}"
                data-media-position="${index + 1}"
                data-variant-selector
              >
                <button
                  class="thumbnail global-media-settings global-media-settings--no-shadow"
                  aria-label="${img.alt}"
                  aria-controls="GalleryViewer-${img.sectionId}"
                  aria-describedby="Thumbnail-Variant-${img.sectionId}-${index + 1}"
                >
                  <img
                    src="${img.url}"
                    id="Thumbnail-Variant-${img.sectionId}-${index + 1}"
                    alt="${img.alt}"
                    class="t-w-full t-h-auto"
                    loading="lazy"
                  >
                </button>
              </li>
            `;
          })
          .join('');
  
        const mediaGallery = document.querySelector('media-gallery');
        if (mediaGallery && mediaGallery.elements?.thumbnails) {
          console.log('🔄 Rebinding media-gallery thumbnail click handlers...');
          mediaGallery.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
            const button = mediaToSwitch.querySelector('button');
            if (button) {
              button.addEventListener('click', () => {
                console.log(`📸 Switching to media ID: ${mediaToSwitch.dataset.target}`);
                mediaGallery.setActiveMedia(mediaToSwitch.dataset.target);
              });
            }
          });
        } else {
          console.warn('⚠️ Could not find media-gallery or thumbnails to bind.');
        }
      });
    });
  });
  