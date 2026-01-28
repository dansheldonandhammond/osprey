document.addEventListener('DOMContentLoaded', function () {
  if (typeof Swiper !== 'undefined') {
    const blogSlider = document.querySelector('#blog-slider ul.carousel');
    if (blogSlider && blogSlider.children.length > 0 && !blogSlider.classList.contains('swiper-initialized')) {
      blogSlider.classList.add('swiper-wrapper');
      Array.from(blogSlider.children).forEach(child => child.classList.add('swiper-slide'));

      const blogSwiper = new Swiper('#blog-slider', {
        slidesPerView: 3,
        spaceBetween: 20,
        loop: false,
        watchOverflow: true,
        navigation: {
          prevEl: '#blog-slider .blog-slider-prev',
          nextEl: '#blog-slider .blog-slider-next'
        },
        pagination: {
          el: '#blog-slider .blog-slider-pagination',
          type: 'custom',
          renderCustom(swiper, current /*, total */) {
            const total = swiper.slides?.length || 0;

            const spv =
              (typeof swiper.params.slidesPerView === 'number' && swiper.params.slidesPerView) ||
              (swiper.currentBreakpoint && swiper.params.breakpoints?.[swiper.currentBreakpoint]?.slidesPerView) ||
              3;

            const chunk = (total <= spv) ? (100 / Math.max(1, spv)) : (spv / total) * 100;

            const maxScrollable = Math.max(0, total - spv);
            const left = maxScrollable === 0 ? 0 : ((current - 1) / maxScrollable) * (100 - chunk);

            return `
              <div class="swiper-pagination-track">
                <span class="swiper-pagination-indicator t-absolute" style="left:${left}%;width:${chunk}%"></span>
              </div>
            `;
          }
        },
        breakpoints: {
          0: { slidesPerView: 1, spaceBetween: 16 },
          768: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 20 }
        },
        on: {
          init() { 
            this.pagination.update();
            // Use setTimeout to ensure this runs after Swiper's internal updates
            setTimeout(() => updateBlogSliderVisibility(this), 0);
          },
          resize() { 
            this.pagination.update();
            // Use setTimeout to ensure this runs after Swiper's internal updates
            setTimeout(() => updateBlogSliderVisibility(this), 0);
          },
          slideChange() { 
            this.pagination.update();
            // Update visibility after Swiper updates disabled states
            setTimeout(() => updateBlogSliderVisibility(this), 10);
          },
          breakpoint() {
            // Update visibility when breakpoint changes
            setTimeout(() => updateBlogSliderVisibility(this), 0);
          }
        }
      });

      // Function to show/hide arrows and pagination based on slidesPerView
      function updateBlogSliderVisibility(swiper) {
        const total = swiper.slides?.length || 0;
        const spv =
          (typeof swiper.params.slidesPerView === 'number' && swiper.params.slidesPerView) ||
          (swiper.currentBreakpoint && swiper.params.breakpoints?.[swiper.currentBreakpoint]?.slidesPerView) ||
          3;

        const prevBtn = document.querySelector('#blog-slider .blog-slider-prev');
        const nextBtn = document.querySelector('#blog-slider .blog-slider-next');
        const pagination = document.querySelector('#blog-slider .blog-slider-pagination');

        // Only show arrows/pagination if there are more slides than what's currently visible
        const shouldShow = total > spv;

        if (prevBtn) {
          if (shouldShow) {
            // Show the arrow - Swiper will automatically handle disabled state based on isBeginning
            prevBtn.style.display = 'flex';
            prevBtn.style.visibility = 'visible';
            prevBtn.style.opacity = '';
            // Don't touch the disabled class - let Swiper manage it
          } else {
            // Hide completely when all items are visible
            prevBtn.style.display = 'none';
            prevBtn.style.visibility = 'hidden';
            prevBtn.style.opacity = '0';
          }
        }
        if (nextBtn) {
          if (shouldShow) {
            // Show the arrow - Swiper will automatically handle disabled state based on isEnd
            nextBtn.style.display = 'flex';
            nextBtn.style.visibility = 'visible';
            nextBtn.style.opacity = '';
            // Don't touch the disabled class - let Swiper manage it
          } else {
            // Hide completely when all items are visible
            nextBtn.style.display = 'none';
            nextBtn.style.visibility = 'hidden';
            nextBtn.style.opacity = '0';
          }
        }
        if (pagination) {
          pagination.style.display = shouldShow ? 'block' : 'none';
        }
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Swiper === 'undefined') return;

  const el = '.top-picks-swiper';
  const navNext = '.top-picks-next';
  const navPrev = '.top-picks-prev';
  const pagEl   = '.top-picks-pagination';

  const container = document.querySelector(el);
  if (!container) return;

  const desktop = parseInt(container.getAttribute('data-desktop') || '4', 10);

  new Swiper(el, {
    slidesPerView: desktop,
    spaceBetween: 25,
    loop: false,
    watchOverflow: false,
    navigation: { nextEl: navNext, prevEl: navPrev },
    pagination: {
      el: pagEl,
      type: 'custom',
      renderCustom(swiper, current /*, total */) {
        const total = swiper.slides?.length || 0;

        const spv =
          (typeof swiper.params.slidesPerView === 'number' && swiper.params.slidesPerView) ||
          (swiper.currentBreakpoint && swiper.params.breakpoints?.[swiper.currentBreakpoint]?.slidesPerView) ||
          desktop || 1;

        const chunk = (total <= spv) ? (100 / Math.max(1, spv)) : (spv / total) * 100;

        const maxScrollable = Math.max(0, total - spv);
        const left = maxScrollable === 0 ? 0 : ((current - 1) / maxScrollable) * (100 - chunk);

        return `
          <div class="swiper-pagination-track">
            <span class="swiper-pagination-indicator t-absolute" style="left:${left}%;width:${chunk}%"></span>
          </div>
        `;
      }
    },
    breakpoints: {
      0:    { slidesPerView: 2, spaceBetween: 16 },
      640:  { slidesPerView: 2,    spaceBetween: 20 },
      1024: { slidesPerView: 3,    spaceBetween: 25 },
      1280: { slidesPerView: desktop, spaceBetween: 25 }
    },
    on: {
      init() { this.pagination.update(); },
      resize() { this.pagination.update(); },
      slideChange() { this.pagination.update(); }
    }
  });
});

// DISCOVER NEW ARRIVALS SWIPER
document.addEventListener('DOMContentLoaded', function () {
  if (typeof Swiper !== 'undefined') {
    const swiperEl = document.querySelector('.new-arrivals-swiper');
    if (!swiperEl) return;

    const swiper = new Swiper('.new-arrivals-swiper', {
      slidesPerView: 4,
      spaceBetween: 25,
      loop: false,
      observer: true,
      observeParents: true,
      preloadImages: false,
      updateOnWindowResize: true,
      navigation: {
        nextEl: '.new-arrivals-next',
        prevEl: '.new-arrivals-prev'
      },
      pagination: {
        el: '.swiper-pagination',
        type: 'custom',
        renderCustom: function (swiper, current, total) {
          const slidesPerView = swiper.params.slidesPerView > 1 ? swiper.params.slidesPerView : 1;
          const pillWidthPercent = Math.min(100, (100 / Math.min(total, slidesPerView === 'auto' ? total : slidesPerView)) * 2);
          const maxLeft = 100 - pillWidthPercent;
          const progress = (current - 1) / (total - 1 || 1);
          const left = maxLeft * progress;

          return `
            <div class="swiper-pagination-track">
              <span class="swiper-pagination-indicator t-absolute" style="left: ${left}%; width: ${pillWidthPercent}%"></span>
            </div>
          `;
        }
      },
      breakpoints: {
        0: { slidesPerView: 1.25, spaceBetween: 16 },
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 25 },
        1280: { slidesPerView: 4, spaceBetween: 25 }
      },
      on: {
        init: function() {
          // Wait for images to load before showing swiper
          const images = swiperEl.querySelectorAll('img');
          let loadedCount = 0;
          const totalImages = images.length;

          const showSwiper = () => {
            swiperEl.classList.add('swiper-initialized');
          };

          if (totalImages === 0) {
            // No images, show immediately
            showSwiper();
            return;
          }

          const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
              // All images loaded, show the swiper
              showSwiper();
            }
          };

          images.forEach((img) => {
            if (img.complete) {
              checkAllLoaded();
            } else {
              img.addEventListener('load', checkAllLoaded);
              img.addEventListener('error', checkAllLoaded); // Show even if image fails
            }
          });
        },
        imagesReady: function() {
          // Fallback: ensure visibility after Swiper's imagesReady event
          swiperEl.classList.add('swiper-initialized');
        }
      }
    });
  } else {
    console.warn('Swiper not available');
    // Fallback: show content even if Swiper fails to load
    const swiperEl = document.querySelector('.new-arrivals-swiper');
    if (swiperEl) {
      swiperEl.classList.add('swiper-initialized');
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Swiper !== 'undefined') {
    new Swiper('.ambassadors-swiper', {
      slidesPerView: 1.25,
      spaceBetween: 25,
      loop: false,
      navigation: {
        nextEl: '.ambassadors-next',
        prevEl: '.ambassadors-prev'
      },
      pagination: {
        el: '.swiper-pagination',
        type: 'custom',
        renderCustom: function (swiper, current, total) {
          const slidesPerView = swiper.params.slidesPerView > 1 ? swiper.params.slidesPerView : 1;
          const visibleSlides = Math.min(total, typeof slidesPerView === 'number' ? slidesPerView : 1);
          const pillWidthPercent = 100 / total;
          const maxLeft = 100 - pillWidthPercent;
          const progress = (current - 1) / (total - 1 || 1);
          const left = maxLeft * progress;

          return `
            <div class="swiper-pagination-track">
              <span class="swiper-pagination-indicator" style="left: ${left}%; width: ${pillWidthPercent}%"></span>
            </div>
          `;
        }
      },
      breakpoints: {
        500: { slidesPerView: 2, spaceBetween: 5 },
        768: { slidesPerView: 3, spaceBetween: 5 },
        1024: { slidesPerView: 4, spaceBetween: 5 }
      }
    });
  } else {
    console.warn('Swiper not available');
  }
});

// Adjusts the height of .sliding-menu-container based on scroll position
function updateSlidingMenuHeight() {
  const banner = document.querySelector('.banner-top-bar');
  const menu = document.querySelector('.sliding-menu-container');
  const header = document.querySelector('header');

  if (!menu || !header) return;

  const headerRect = header.getBoundingClientRect();
  const headerHeight = headerRect.height;

  let bannerHeight = 0;
  if (banner) {
    const bannerRect = banner.getBoundingClientRect();
    bannerHeight = bannerRect.height;
  }

  if (window.scrollY > bannerHeight) {
    menu.style.setProperty('height', `calc(100vh - ${headerHeight}px)`, 'important');
  } else {
    menu.style.setProperty('height', `calc(100vh - ${headerHeight}px + ${bannerHeight}px)`, 'important');
  }
}

window.addEventListener('scroll', updateSlidingMenuHeight);
window.addEventListener('resize', updateSlidingMenuHeight);

document.addEventListener('DOMContentLoaded', updateSlidingMenuHeight);

document.addEventListener('click', function(e) {
  if (e.target.closest('.sliding-menu-toggle')) {
    setTimeout(updateSlidingMenuHeight, 10);
  }
});



// Adjusts the height of .sliding-menu-container and the bottom position of .shop-all-button based on scroll position
function updateSlidingMenuHeight() {
  const banner = document.querySelector('.banner-top-bar');
  const menu = document.querySelector('.sliding-menu-container');
  const header = document.querySelector('header');
  const shopAllBtn = document.querySelector('.shop-all-button');

  if (!menu || !header) return;

  const headerRect = header.getBoundingClientRect();
  const headerHeight = headerRect.height;

  let bannerHeight = 0;
  if (banner) {
    const bannerRect = banner.getBoundingClientRect();
    bannerHeight = bannerRect.height;
  }

  if (window.scrollY > bannerHeight) {
    menu.style.setProperty('height', `calc(100vh - ${headerHeight}px)`, 'important');
    if (shopAllBtn) shopAllBtn.style.bottom = '100px';
  } else {
    menu.style.setProperty('height', `calc(100vh - ${headerHeight}px + ${bannerHeight}px)`, 'important');
    if (shopAllBtn) shopAllBtn.style.bottom = '150px';
  }
}

window.addEventListener('scroll', updateSlidingMenuHeight);
window.addEventListener('resize', updateSlidingMenuHeight);

document.addEventListener('DOMContentLoaded', updateSlidingMenuHeight);

document.addEventListener('click', function(e) {
  if (e.target.closest('.sliding-menu-toggle')) {
    setTimeout(updateSlidingMenuHeight, 10);
  }
});






(function() {
  'use strict';
  
  // Global variables
  const VARIANT_PARAM = 'variant';
  let lastKnownVariant = null;
  let debounceTimer = null;

  // Utility functions
  function getVariantFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get(VARIANT_PARAM);
  }

  // ---- SHOPIFY IMAGE NORMALIZER (works on custom domain /cdn/shop) ----
  function normalizeShopifyImage(url, targetWidth = 2048) {
    if (!url) return url;

    // Make absolute for parsing
    const abs = url.startsWith('http') ? url : new URL(url, window.location.origin).toString();
    let u;
    try { u = new URL(abs); } catch { return url; }

    // Detect Shopify images:
    //  - myshopify/cdn.shopify hosts
    //  - custom domains serving through /cdn/shop/ path (Online Store 2.0)
    const host = u.hostname;
    const isShopifyHost =
      /(^|\.)(cdn\.shopify\.com|shopify\.com)$/i.test(host) ||
      /\.myshopify\.com$/i.test(host);
    const isShopifyPath = u.pathname.startsWith('/cdn/shop/');
    if (!(isShopifyHost || isShopifyPath)) return url;

    // Preserve existing params we care about
    const v = u.searchParams.get('v');
    const crop = u.searchParams.get('crop'); // keep crop if present

    // Always prefer query-param sizing per docs
    u.searchParams.set('width', String(targetWidth));
    // Remove conflicting height so we don't force a small square
    u.searchParams.delete('height');
    // Re-apply preserved params
    if (crop) u.searchParams.set('crop', crop);
    if (v) u.searchParams.set('v', v);

    // Strip legacy path suffixes so CDN honors ?width=
    u.pathname = u.pathname.replace(
      /(_\d+x\d*|\d+x\d*_|_\d+x|_x\d+|_compact|_cropped|_grande|_icon|_large|_master|_medium|_pico|_small|_thumb|_mini|_original)(?=\.(jpe?g|png|gif|webp))/ig,
      ''
    );

    return u.toString();
  }

  function setFeaturedImageAggressively(featuredImage, src, fallbackSrc = null) {
    console.log('Setting featured image aggressively:', src);

    // Remove all lazy loading interference
    featuredImage.loading = 'eager';
    featuredImage.decoding = 'sync';
    featuredImage.removeAttribute('data-src');
    featuredImage.removeAttribute('data-srcset');
    featuredImage.classList.remove('lazy', 'lazyload', 'lazyloaded', 'lazyloading');
    featuredImage.srcset = '';
    featuredImage.sizes = '';

    // Try descending sizes, then fallback at same sizes
    const widths = [2048, 1800, 1200, 800];
    const candidates = [
      ...widths.map(w => normalizeShopifyImage(src, w)),
      ...(fallbackSrc ? widths.map(w => normalizeShopifyImage(fallbackSrc, w)) : []),
    ];

    let i = 0;
    function tryNextImage() {
      if (i >= candidates.length) {
        console.warn('All image loading attempts failed');
        return;
      }

      const currentSrc = candidates[i++];
      console.log(`Trying image ${i}/${candidates.length}: ${currentSrc}`);

      const tempImg = new Image();

      tempImg.onload = function() {
        console.log(`Loaded: ${currentSrc} (${this.naturalWidth}x${this.naturalHeight})`);
        if (this.naturalWidth > 800 || i === candidates.length) {
          featuredImage.src = currentSrc;
          featuredImage.style.display = 'block';
          featuredImage.style.opacity = '1';
          featuredImage.style.visibility = 'visible';
        } else {
          console.warn(`Image too small (${this.naturalWidth}px), trying next...`);
          tryNextImage();
        }
      };

      tempImg.onerror = function() {
        console.warn(`Failed to load: ${currentSrc}`);
        tryNextImage();
      };

      // Reduced timeout from 3000ms to 1500ms for faster fallback
      setTimeout(() => {
        if (!tempImg.complete) {
          console.warn(`Image loading timeout: ${currentSrc}`);
          tryNextImage();
        }
      }, 1500);

      tempImg.src = currentSrc;
    }

    // Safety: if something else swaps in a small image later, upsize it back
    const guardSmall = () => {
      if (featuredImage.naturalWidth && featuredImage.naturalWidth < 600) {
        featuredImage.src = normalizeShopifyImage(featuredImage.src, 2048);
      }
    };
    featuredImage.addEventListener('load', guardSmall, { passive: true });

    tryNextImage();
  }

  function updateGallery(variantId) {
    console.log(`updateGallery called with variantId: ${variantId}`);

    const data = JSON.parse(document.getElementById('variant-gallery-data').textContent);
    const variant = data[variantId];
    const featuredImage = document.getElementById('FeaturedImage');
    const allThumbs = document.querySelectorAll('.variant-thumbnail');
    const totalVariants = window.productVariants.length;
    const isChromeeMobile = /Chrome/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent);

    console.log('Variant data:', variant);
    console.log('Is Chrome Mobile:', isChromeeMobile);

    // Chrome mobile-safe thumbnail management
    if (isChromeeMobile) {
      allThumbs.forEach((img) => {
        img.classList.remove('t-ring-2', 't-ring-primary');
        if (totalVariants > 1) {
          const thumbSku = img.getAttribute('thumbnail-sku');
          if (variant && thumbSku !== variant.sku) {
            img.style.opacity = '0';
            img.style.pointerEvents = 'none';
            img.setAttribute('aria-hidden', 'true');
          } else {
            img.style.opacity = '1';
            img.style.pointerEvents = 'auto';
            img.removeAttribute('aria-hidden');
          }
        }
      });
    } else {
      allThumbs.forEach((img) => {
        img.classList.remove('t-ring-2', 't-ring-primary');
        if (totalVariants > 1) {
          const thumbSku = img.getAttribute('thumbnail-sku');
          if (variant && thumbSku !== variant.sku) {
            img.style.visibility = 'hidden';
            img.style.position = 'absolute';
            img.style.left = '-9999px';
          } else {
            img.style.visibility = 'visible';
            img.style.position = 'static';
            img.style.left = 'auto';
          }
        }
      });
    }

    // Handle missing variant or gallery data
    if (!variant || !variant.gallery || variant.gallery.length === 0) {
      console.warn(`No gallery found for variant ID: ${variantId}`);

      const fallbackVariant = window.productVariants.find((v) => v.id == variantId);
      const fallbackImageEl = document.querySelector(`[thumbnail-sku="${fallbackVariant?.sku}"]`);
      let fallbackImage = fallbackImageEl?.src;

      if (fallbackImage && featuredImage) {
        fallbackImage = normalizeShopifyImage(fallbackImage, 2048);
        console.log(`Using fallback image: ${fallbackImage}`);
        setFeaturedImageAggressively(featuredImage, fallbackImage);
      } else {
        console.warn(`No fallback image found`);
      }
      return;
    }

    // Set featured image (always big)
    let featuredImageSrc = normalizeShopifyImage(variant.gallery[0], 2048);
    console.log(`Setting featured image to: ${featuredImageSrc}`);
    setFeaturedImageAggressively(featuredImage, featuredImageSrc, variant.gallery[0]);

    // Setup thumbnails for current variant
    const selector = `[thumbnail-sku="${variant.sku}"]`;
    const matchingThumbs = document.querySelectorAll(selector);
    console.log(`Found ${matchingThumbs.length} matching thumbnails for SKU: ${variant.sku}`);

    requestAnimationFrame(() => {
      matchingThumbs.forEach((thumb, i) => {
        // Ensure visible
        thumb.style.opacity = '1';
        thumb.style.pointerEvents = 'auto';
        thumb.removeAttribute('aria-hidden');

        if (isChromeeMobile) thumb.offsetHeight; // force layout

        // Use data-full when present; otherwise upscale currentSrc/src
        const clickHandler = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          // If thumb is inside an anchor, block its default jump
          const a = e?.currentTarget?.closest?.('a');
          if (a) {
            a.addEventListener('click', (evt) => {
              evt.preventDefault();
              evt.stopPropagation();
            }, { once: true, capture: true });
          }

          const source = thumb.dataset.full ? thumb.dataset.full : (thumb.currentSrc || thumb.src);
          const highResThumbSrc = normalizeShopifyImage(source, 2048);
          console.log(`Thumbnail clicked, setting featured to ${highResThumbSrc}`);

          setFeaturedImageAggressively(featuredImage, highResThumbSrc, source);

          matchingThumbs.forEach((t) => t.classList.remove('t-ring-2', 't-ring-primary'));
          thumb.classList.add('t-ring-2', 't-ring-primary');
        };

        thumb.removeEventListener('click', thumb._variantClickHandler);
        thumb.addEventListener('click', clickHandler);
        thumb._variantClickHandler = clickHandler;

        if (i === 0) {
          thumb.classList.add('t-ring-2', 't-ring-primary');
        }
      });

      const container = document.getElementById('GalleryThumbnails');
      if (container && isChromeeMobile) {
        container.style.transform = 'translateZ(0)';
        container.offsetHeight;
      }
    });
  }

  function checkVariantAvailability(variantId) {
    if (!window.productVariants) return null;
    
    const variant = window.productVariants.find((v) => v.id == variantId);
    if (!variant) {
      console.log('Variant not found:', variantId);
      return null;
    }

    // Get complete variant data
    let completeVariant = variant;
    if (window.buyButtonsProductVariants) {
      const fullVariant = window.buyButtonsProductVariants.find((v) => v.id == variantId);
      if (fullVariant) {
        completeVariant = { ...variant, ...fullVariant };
      }
    }

    // Check stock status
    let isOutOfStock = false;
    if (completeVariant.available !== undefined) {
      isOutOfStock = !completeVariant.available;
      
      if (completeVariant.inventory_management === 'shopify' && completeVariant.inventory_policy !== 'continue') {
        if (completeVariant.inventory_quantity !== undefined && completeVariant.inventory_quantity <= 0) {
          isOutOfStock = true;
        }
      }
    }

    // Dispatch a SAFE custom event (doesn't collide with theme handlers)
    const availabilityEvent = new CustomEvent('nebula:variant-availability', {
      detail: {
        variant: {
          id: completeVariant.id,
          available: completeVariant.available,
          inventory_quantity: completeVariant.inventory_quantity,
          inventory_management: completeVariant.inventory_management,
          inventory_policy: completeVariant.inventory_policy,
          isOutOfStock: isOutOfStock,
        },
      },
    });
    document.dispatchEvent(availabilityEvent);
    
    return completeVariant;
  }

  function processVariantSelection() {
    console.log('Processing variant selection...');
    
    const selectedOptions = [];
    const allOptionGroups = document.querySelectorAll(
      '.product-form__input--swatch, .product-form__input--dropdown, .product-form__input--pill'
    );
    
    allOptionGroups.forEach((group) => {
      let selectedValue = null;
      
      const checkedInput = group.querySelector('.swatch-input__input:checked, input[type="radio"]:checked');
      if (checkedInput) {
        selectedValue = checkedInput.value;
      }
      
      const selectInput = group.querySelector('select');
      if (selectInput && selectInput.value) {
        selectedValue = selectInput.value;
      }
      
      if (selectedValue) {
        selectedOptions.push(selectedValue);
      }
    });

    if (window.productVariants && selectedOptions.length > 0) {
      const matchingVariant = window.productVariants.find((variant) => {
        const variantOptions = [variant.option1, variant.option2, variant.option3].filter((opt) => opt !== null);
        return variantOptions.every((option, index) => option === selectedOptions[index]);
      });

      if (matchingVariant) {
        console.log('Found matching variant:', matchingVariant.id);
        
        const url = new URL(window.location);
        url.searchParams.set(VARIANT_PARAM, matchingVariant.id);
        history.replaceState({}, '', url); // no scroll

        const variantIdInput = document.querySelector('input[name="id"]');
        if (variantIdInput) {
          variantIdInput.value = matchingVariant.id;
        }

        lastKnownVariant = matchingVariant.id;
        checkVariantAvailability(matchingVariant.id);
        
        // REMOVED DELAY: Update gallery immediately
        updateGallery(matchingVariant.id.toString());
      }
    }
  }

  function setupVariantListeners() {
    const allVariantInputs = document.querySelectorAll(
      '.swatch-input__input, ' +
      '.product-form__input--dropdown select, ' +
      '.product-form__input input[type="radio"], ' +
      '.product-form__input--pill input[type="radio"], ' +
      'input[name*="option"], input[name*="Option"], ' +
      'select[name*="option"], select[name*="Option"], ' +
      'input[name*="Colour"], input[name*="Color"], input[name*="Size"]'
    );
    
    console.log('Found variant inputs:', allVariantInputs.length);

    allVariantInputs.forEach((input) => {
      // IMMEDIATE PROCESSING: Remove debouncing for change events
      input.addEventListener('change', function() {
        const isSelected = this.type === 'radio' ? this.checked : true;
        if (isSelected) {
          // Clear any pending debounced calls
          clearTimeout(debounceTimer);
          // Process immediately
          processVariantSelection();
        }
      });

      // Keep minimal debouncing for input events (typing in dropdowns)
      input.addEventListener('input', function() {
        const isSelected = this.type === 'radio' ? this.checked : true;
        if (isSelected) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            processVariantSelection();
          }, 50); // Reduced from 100ms to 50ms
        }
      });
    });
  }

  function initializeVariant() {
    const variantFromUrl = getVariantFromUrl();
    const fallback = ShopifyAnalytics?.meta?.product?.variants?.[0]?.id || 
                    ShopifyAnalytics?.meta?.selectedVariantId ||
                    window.productVariants[0]?.id;
    
    const initialVariantId = variantFromUrl || fallback;
    
    console.log('Initial variant ID:', initialVariantId);
    
    if (initialVariantId) {
      lastKnownVariant = initialVariantId;
      
      requestAnimationFrame(() => {
        updateGallery(initialVariantId.toString());
        checkVariantAvailability(initialVariantId);
      });
    }
  }

  function applyFallbackStyling() {
    const visibleThumbnails = document.querySelectorAll(
      '.variant-thumbnail:not([style*="opacity: 0"]), .variant-thumbnail:not([aria-hidden="true"])'
    );
    const processedSkus = new Set();
    
    visibleThumbnails.forEach((thumb) => {
      const sku = thumb.getAttribute('thumbnail-sku');
      const index = parseInt(thumb.getAttribute('data-index'));
      
      if (sku && index === 0 && !processedSkus.has(sku)) {
        thumb.classList.add('t-ring-2', 't-ring-primary');
        processedSkus.add(sku);
        console.log('Applied fallback styling to first thumbnail of SKU:', sku);
      }
    });
  }

  function debugGalleryData() {
    console.log('GALLERY DEBUG INFO:');
    console.log('User Agent:', navigator.userAgent);
    console.log('Is Chrome Mobile:', /Chrome/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent));
    
    const galleryDataEl = document.getElementById('variant-gallery-data');
    if (galleryDataEl) {
      const data = JSON.parse(galleryDataEl.textContent);
      console.log('Gallery data:', data);
    }
    
    const featuredImage = document.getElementById('FeaturedImage');
    if (featuredImage) {
      console.log('Featured image src:', featuredImage.src);
      console.log('Featured image naturalWidth:', featuredImage.naturalWidth);
    }
    
    const thumbnails = document.querySelectorAll('.variant-thumbnail');
    console.log(`Found ${thumbnails.length} thumbnails:`);
    thumbnails.forEach((thumb, i) => {
      const computed = window.getComputedStyle(thumb);
      console.log(`  ${i}: SKU ${thumb.getAttribute('thumbnail-sku')}`);
      console.log(`    Opacity: ${computed.opacity}, Visibility: ${computed.visibility}`);
      console.log(`    Pointer Events: ${computed.pointerEvents}`);
    });
  }

  // Make functions globally available
  window.checkVariantAvailability = checkVariantAvailability;
  window.updateGallery = updateGallery;
  window.debugGalleryData = debugGalleryData;

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - initializing variant management');

    // Reserve space for featured image to avoid layout-jump scroll
    const featuredImageEl = document.getElementById('FeaturedImage');
    if (featuredImageEl) {
      featuredImageEl.style.aspectRatio = featuredImageEl.style.aspectRatio || '4 / 3'; // adjust to your real ratio
      featuredImageEl.style.display = featuredImageEl.style.display || 'block';
    }

    // Stop browser auto-scrolling on bfcache restore
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Prevent focus-induced scroll jumps (some themes focus inputs on change)
    document.addEventListener('focus', (e) => {
      const el = e.target;
      if (el && typeof el.focus === 'function') {
        try { el.focus({ preventScroll: true }); } catch (_) {}
      }
    }, true);

    // Global guard: block anchor default jumps like href="#" or hash-only links
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#')) {
        e.preventDefault();
      }
    }, { capture: true });

    initializeVariant();
    setupVariantListeners();

    // LISTEN ONLY to theme variant:change (do not dispatch it ourselves)
    document.addEventListener('variant:change', (event) => {
      const newId = event.detail?.variant?.id;
      if (newId && newId !== lastKnownVariant) {
        console.log('[theme] variant:change heard with ID:', newId);
        lastKnownVariant = newId;
        // REMOVED DELAY: Update immediately
        updateGallery(String(newId));
      }
    });

    // Our internal safe event that we dispatch from checkVariantAvailability
    document.addEventListener('nebula:variant-availability', (event) => {
      const newId = event.detail?.variant?.id;
      if (newId && newId !== lastKnownVariant) {
        console.log('[nebula] availability change with ID:', newId);
        lastKnownVariant = newId;
        // REMOVED DELAY: Update immediately
        updateGallery(String(newId));
      }
    });

    // REDUCED DELAY: From 200ms to 50ms
    setTimeout(() => {
      console.log('Initial page load variant processing...');
      debugGalleryData();
      processVariantSelection();
      applyFallbackStyling();
      
      // REDUCED DELAY: From 50ms to 10ms
      setTimeout(() => {
        if (typeof syncBorderWithFeaturedImage === 'function') {
          syncBorderWithFeaturedImage();
        }
      }, 10);
    }, 50);

    window.addEventListener('popstate', function() {
      const urlVariantId = getVariantFromUrl();
      if (urlVariantId && urlVariantId !== lastKnownVariant) {
        console.log('Browser navigation detected, checking variant:', urlVariantId);
        lastKnownVariant = urlVariantId;
        checkVariantAvailability(urlVariantId);
        
        // REMOVED DELAY: Update immediately
        updateGallery(urlVariantId);
      }
    });
  });

})();

// Prevent focus from scrolling to hidden inputs
document.addEventListener('focus', (e) => {
  const el = e.target;
  if (el.tagName === 'INPUT' && el.type === 'radio') {
    try {
      el.focus({ preventScroll: true });
    } catch(_) {}
  }
}, true);

document.addEventListener('focus', (e) => {
  const el = e.target;
  if (el.tagName === 'INPUT' && el.type === 'radio' && el.classList.contains('swatch-input__input')) {
    try {
      el.focus({ preventScroll: true });
    } catch (_) {
      // older browsers ignore preventScroll
    }
  }
}, true);