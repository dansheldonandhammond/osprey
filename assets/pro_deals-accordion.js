  document.addEventListener('DOMContentLoaded', function () {
    const accordionHeaders = document.querySelectorAll('.accordion_heading');

    accordionHeaders.forEach((header) => {
      header.addEventListener('click', function () {
        const accordionContent = this.nextElementSibling;
        const isActive = this.classList.contains('active');

        // Optional: Close all other accordions (remove this section for multi-open)
        accordionHeaders.forEach((otherHeader) => {
          if (otherHeader !== this) {
            otherHeader.classList.remove('active');
            otherHeader.setAttribute('aria-expanded', 'false');
            otherHeader.nextElementSibling.style.height = '0px';
            otherHeader.nextElementSibling.style.paddingBottom = '0px';
            otherHeader.nextElementSibling.style.marginBottom = '0px';
          }
        });

        // Toggle current accordion
        this.classList.toggle('active');
        this.setAttribute('aria-expanded', !isActive);

        if (!isActive) {
          accordionContent.style.height = accordionContent.scrollHeight + 'px';
          accordionContent.style.paddingBottom = '16px';
          accordionContent.style.marginBottom = '15px';
        } else {
          accordionContent.style.height = '0px';
          accordionContent.style.paddingBottom = '0px';
          accordionContent.style.marginBottom = '0px';
        }
      });
    });
  });