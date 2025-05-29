document.addEventListener('DOMContentLoaded', function () {
  if (typeof Swiper !== 'undefined') {
    const blogSlider = document.querySelector('#blog-slider ul.carousel');
    if (blogSlider && blogSlider.children.length > 0 && !blogSlider.classList.contains('swiper-initialized')) {
      blogSlider.classList.add('swiper-wrapper');
      Array.from(blogSlider.children).forEach(child => child.classList.add('swiper-slide'));

      new Swiper('#blog-slider', {
        slidesPerView: 3,
        spaceBetween: 24,
        loop: false,
        navigation: {
          nextEl: '#blog-slider .swiper-button-next',
          prevEl: '#blog-slider .swiper-button-prev'
        },
        breakpoints: {
          1024: { slidesPerView: 3 },
          768: { slidesPerView: 1 }
        },pagination: {
          el: '.swiper-pagination',
          type: 'custom',
          renderCustom: function (swiper, current, total) {
            const slidesPerView = swiper.params.slidesPerView > 1 ? swiper.params.slidesPerView : 1;
            const pillWidthPercent = 100 / Math.min(total, slidesPerView === 'auto' ? total : slidesPerView);
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
        
        
      });
    }
  } 
});



// DISCOVER NEW ARRIVALS SWIPER
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof Swiper !== 'undefined') {
      new Swiper('.new-arrivals-swiper', {
        slidesPerView: 4,
        spaceBetween: 25,
        loop: false,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        pagination: {
          el: '.swiper-pagination',
          type: 'custom',
          renderCustom: function (swiper, current, total) {
            const slidesPerView = swiper.params.slidesPerView > 1 ? swiper.params.slidesPerView : 1;
            const pillWidthPercent = 100 / Math.min(total, slidesPerView === 'auto' ? total : slidesPerView);
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
        }
      });
    } else {
      console.warn('Swiper not available');
    }
  });
