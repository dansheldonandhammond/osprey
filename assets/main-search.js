class MainSearch {
  constructor() {
    // Find the search input directly - look for the specific ID first, then fallback
    this.searchInput = document.getElementById('Search-In-Template') || document.querySelector('input[type="search"]');
    this.allSearchInputs = document.querySelectorAll('input[type="search"]');
    this.productGrid = document.getElementById('ProductGridContainer');
    this.debounceTimer = null;
    
    // Track search and filter update state
    this.isSearchUpdate = false;
    this.facetUpdateTimeout = null;
    
    // Initialize global flag to prevent facet conflicts
    window.mainSearchUpdating = false;
    
    // Only setup if we have required elements
    if (this.searchInput && this.productGrid) {
      this.setupEventListeners();
      this.setupURLWatcher();
    } else {
      console.warn('MainSearch: Missing required elements, retrying in 500ms...', {
        searchInput: !!this.searchInput,
        productGrid: !!this.productGrid
      });
      
      // Retry after a delay in case elements aren't ready yet
      setTimeout(() => {
        this.searchInput = document.getElementById('Search-In-Template') || document.querySelector('input[type="search"]');
        this.productGrid = document.getElementById('ProductGridContainer');
        
        if (this.searchInput && this.productGrid) {
          this.setupEventListeners();
          this.setupURLWatcher();
        } else {
          console.error('MainSearch: Still missing required elements after retry');
        }
      }, 500);
    }
  }

  setupEventListeners() {
    if (!this.searchInput) {
      console.warn('SearchInput not found, cannot setup event listeners');
      return;
    }
    
    console.log('Setting up event listeners on search input:', this.searchInput);
    
    let allSearchForms = [];
    this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
    
    // Use the safe searchInput reference
    this.searchInput.addEventListener('focus', this.onInputFocus.bind(this));
    console.log('Added focus listener');
    
    // Add live search on input for real-time search
    this.searchInput.addEventListener('input', this.onLiveSearchInput.bind(this));
    console.log('Added input listener for live search');
    
    // Add a simple test listener to verify events are working
    this.searchInput.addEventListener('input', (e) => {
      console.log('TEST: Input event fired! Value:', e.target.value);
    });
    
    // Add keydown listener only for Enter key
    this.searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        console.log('Enter key pressed');
        this.onLiveSearchInput(event);
      }
    });
    console.log('Added keydown listener for Enter');
    
    // Listen for facet form submissions to combine with current search
    const facetForms = document.querySelectorAll('facet-filters-form form, .facets form, .mobile-facets form');
    facetForms.forEach(form => {
      form.addEventListener('change', (event) => {
        // When a filter changes, combine it with current search
        this.handleFilterChange(event);
      });
    });
    
    // Listen for active filter removals  
    const activeFilters = document.querySelectorAll('.active-facets a');
    activeFilters.forEach(filter => {
      filter.addEventListener('click', () => {
        // Filter removal - will be handled by Shopify's system
        // but we might want to update search results accordingly
      });
    });
    
    if (allSearchForms.length < 2) return;
    allSearchForms.forEach((form) => form.addEventListener('reset', this.onFormReset.bind(this)));
    // Don't add the generic input listener as it conflicts with live search
    // this.allSearchInputs.forEach((input) => input.addEventListener('input', this.onInput.bind(this)));
  }

  // Handle filter changes - combine with current search
  handleFilterChange(event) {
    try {
      const currentSearch = this.searchInput?.value?.trim() || '';
      
      if (currentSearch) {
        // There's an active search - combine it with the new filter
        console.log('Filter changed during search, combining filter with search term:', currentSearch);
        
        // Small delay to let the filter form process, then re-run search with filters
        setTimeout(() => {
          this.performLiveSearch(currentSearch);
        }, 100);
      }
      // If no search term, let normal filter behavior handle it
      
    } catch (error) {
      console.error('Error handling filter change:', error);
    }
  }

  // Essential methods from SearchForm
  onFormReset() {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
  }

  onInput(event) {
    // Basic input handling - can be extended
  }

  onInputFocus() {
    // Focus handling - can be extended  
  }

  onLiveSearchInput(event) {
    if (!event || !event.target) {
      console.warn('Invalid event in onLiveSearchInput');
      return;
    }
    
    const query = event.target.value.trim();
    
    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // If user pressed Enter, search immediately
    if (event.type === 'keydown' && event.key === 'Enter') {
      event.preventDefault();
      this.performLiveSearch(query);
      return;
    }
    
    // Debounce the search to avoid too many requests (100ms for very responsive typing)
    this.debounceTimer = setTimeout(() => {
      this.performLiveSearch(query);
    }, query === '' ? 50 : 100); // Faster for clearing search
  }

  async performLiveSearch(query) {
    // NEW APPROACH: Use Dawn's native facet rendering system for perfect consistency
    // This leverages FacetFiltersForm.renderFilters, renderProductGridContainer, etc.
    // to maintain exact same structure, styling, and behavior as native facets.
    
    // Set flag to indicate this is a search-initiated update
    this.isSearchUpdate = true;
    
    // Add global flag to prevent facet form conflicts during search updates
    window.mainSearchUpdating = true;
    
    // Cancel any previous search
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    
    try {
      // Collect current filter/sort params from the same forms facets.js uses
      const forms = document.querySelectorAll('facet-filters-form form');
      const paramsParts = [];
      
      forms.forEach((form) => {
        const fd = new FormData(form);
        paramsParts.push(new URLSearchParams(fd).toString());
      });

      // Add/override the search query (and Shopify's prefix quirk)
      const merged = new URLSearchParams(paramsParts.join('&'));
      if (query) {
        merged.set('q', query);
      } else {
        merged.delete('q');
      }
      if (!merged.has('options[prefix]')) {
        merged.set('options[prefix]', 'last');
      }

      // IMPORTANT: fetch the same section Dawn uses for facets
      const sectionId = document.getElementById('product-grid')?.dataset.id;
      if (!sectionId) {
        console.warn('Could not find product-grid section ID');
        return;
      }
      
      const url = `${window.location.pathname}?section_id=${sectionId}&${merged.toString()}`;

      // Loading state like facets.js
      const spinners = document.querySelectorAll('.facets-container .loading__spinner, facet-filters-form .loading__spinner');
      spinners.forEach((s) => s.classList.remove('hidden'));
      document.getElementById('ProductGridContainer')?.querySelector('.collection')?.classList.add('loading');

      const response = await fetch(url, { signal: this.abortController.signal });
      const html = await response.text();
      
      // Check if we got results
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const hasResults = this.checkForResults(doc);
      
      if (!hasResults && query && this.hasActiveFilters()) {
        // No results with current search + filters combination
        // Clear filters and search again to show results for just the search term
        console.log('Search + filters returned no results. Clearing filters and searching again...');
        this.clearAllActiveFiltersCompletely();
        await this.performLiveSearch(query);
        return;
      }

      // Use the *native* renderers so structure & styling stay perfect
      if (typeof FacetFiltersForm !== 'undefined' && FacetFiltersForm.renderFilters) {
        try {
          // Check if the HTML contains the expected elements before rendering
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Verify critical elements exist
          const hasProductGrid = doc.getElementById('ProductGridContainer');
          const hasProductCount = doc.getElementById('ProductCount') || doc.getElementById('ProductCountDesktop');
          
          if (!hasProductGrid) {
            throw new Error('ProductGridContainer not found in response HTML');
          }
          
          FacetFiltersForm.renderFilters(html, null);
          FacetFiltersForm.renderProductGridContainer(html);
          
          // Only render product count if element exists
          if (hasProductCount) {
            FacetFiltersForm.renderProductCount(html);
          }
          
          FacetFiltersForm.updateURLHash(merged.toString());
          
          // Reinitialize price range elements after DOM updates
          setTimeout(() => {
            this.reinitializePriceSlider();
            this.reinitializeProductForms();
          }, 50);
        } catch (renderError) {
          console.warn('Native rendering failed, likely due to filter/search mismatch:', renderError);
          
          // If we have active filters and rendering fails, clear filters and try again
          if (this.hasActiveFilters()) {
            console.log('Clearing filters due to rendering error and retrying search...');
            this.clearAllActiveFiltersCompletely();
            await this.performLiveSearch(query);
            return;
          } else {
            // If no filters but still failing, fall back to manual rendering
            console.log('Falling back to manual rendering due to native rendering error');
            await this.performLiveSearchFallback(query, html);
            return;
          }
        }
      } else {
        console.warn('FacetFiltersForm not available, falling back to manual rendering');
        // Fallback to our old method if FacetFiltersForm isn't available
        await this.performLiveSearchFallback(query, html);
        return;
      }

      // Keep all search boxes in sync
      this.keepInSync(query || '', this.searchInput);
      
      // Dispatch a custom event to let other parts know search was updated
      document.dispatchEvent(new CustomEvent('searchFiltersUpdated', {
        detail: { searchTerm: query || '' }
      }));

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Search request was cancelled');
        return;
      }
      
      // Check if this is a filter/search compatibility error
      if (this.hasActiveFilters() && (
        error.message.includes('innerHTML') || 
        error.message.includes('getElementById') ||
        error.message.includes('null')
      )) {
        console.log('Detected filter/search compatibility error, clearing filters and retrying...');
        this.clearAllActiveFiltersCompletely();
        await this.performLiveSearch(query);
        return;
      }
      
      console.error('Live search error:', error);
      // Hide loading state on error
      const spinners = document.querySelectorAll('.facets-container .loading__spinner, facet-filters-form .loading__spinner');
      spinners.forEach((s) => s.classList.add('hidden'));
      document.getElementById('ProductGridContainer')?.querySelector('.collection')?.classList.remove('loading');
    } finally {
      // Clear the search update flag
      this.isSearchUpdate = false;
      // Clear global flag to re-enable facet form events after a small delay
      // This ensures DOM updates are fully complete before facet events can fire
      setTimeout(() => {
        window.mainSearchUpdating = false;
      }, 100);
    }
  }

  // Fallback method for older Dawn versions that don't have FacetFiltersForm exposed
  async performLiveSearchFallback(query, html = null) {
    console.warn('Using fallback live search method');
    
    try {
      // If we don't have HTML, fetch it
      if (!html) {
        const currentUrl = new URL(window.location);
        const urlParams = new URLSearchParams(currentUrl.search);
        
        if (query) {
          urlParams.set('q', query);
        } else {
          urlParams.delete('q');
        }
        
        if (!urlParams.has('options[prefix]')) {
          urlParams.set('options[prefix]', 'last');
        }
        
        const searchUrl = `/search?${urlParams.toString()}&section_id=main-search`;
        const response = await fetch(searchUrl);
        html = await response.text();
      }
      
      // Basic manual rendering for product grid
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newProductGrid = doc.getElementById('ProductGridContainer');
      
      if (newProductGrid && this.productGrid) {
        this.productGrid.innerHTML = newProductGrid.innerHTML;
      }
      
      // Reinitialize price range elements after fallback rendering
      setTimeout(() => {
        this.reinitializePriceSlider();
        this.reinitializeProductForms();
      }, 50);
      
      // Update URL
      const currentUrlParams = new URLSearchParams(window.location.search);
      if (query) {
        currentUrlParams.set('q', query);
      } else {
        currentUrlParams.delete('q');
      }
      const newUrl = `/search${currentUrlParams.toString() ? '?' + currentUrlParams.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
      
      // Keep search boxes in sync
      this.keepInSync(query || '', this.searchInput);
      
    } catch (error) {
      console.error('Fallback search failed:', error);
    }
    
    this.isSearchUpdate = false;
    // Clear global flag to re-enable facet form events after a small delay
    setTimeout(() => {
      window.mainSearchUpdating = false;
    }, 100);
  }
  
  showLoadingState() {
    if (this.productGrid) {
      // Use a more subtle loading state that's less jarring
      this.productGrid.style.opacity = '0.85';
      this.productGrid.style.transition = 'opacity 0.1s ease';
      // Don't disable pointer events - let users still interact
      
      // Add a subtle loading indicator to the search input
      if (this.searchInput) {
        this.searchInput.style.backgroundColor = '#f8f9fa';
        this.searchInput.style.borderColor = '#007bff';
      }
    }
  }
  
  hideLoadingState() {
    if (this.productGrid) {
      this.productGrid.style.opacity = '1';
      this.productGrid.style.transition = 'opacity 0.1s ease';
      this.productGrid.style.pointerEvents = 'auto';
      
      // Reset search input styling
      if (this.searchInput) {
        this.searchInput.style.backgroundColor = '';
        this.searchInput.style.borderColor = '';
      }
    }
  }
  
  updateResultCount(doc) {
    const currentCountElement = document.getElementById('ProductCountDesktop');
    const newCountElement = doc.getElementById('ProductCountDesktop');
    
    if (currentCountElement && newCountElement) {
      currentCountElement.innerHTML = newCountElement.innerHTML;
    }
  }

  // Update filter options to show only what's available in current search results
  updateFilterOptions(doc) {
    try {
      // Validate the document
      if (!doc || !doc.querySelectorAll) {
        console.warn('Invalid document provided to updateFilterOptions');
        return;
      }
      
      console.log('=== UPDATING FILTER OPTIONS ===');
      
      // Look for the specific FacetsWrapperDesktop container that was shown in the structure
      const currentContainer = document.querySelector('#FacetsWrapperDesktop');
      const newContainer = doc.querySelector('#FacetsWrapperDesktop');
      
      console.log('Current FacetsWrapperDesktop found:', !!currentContainer);
      console.log('New FacetsWrapperDesktop found:', !!newContainer);
      
      if (!currentContainer || !newContainer) {
        // Fallback to any facets container we can find
        const fallbackCurrent = document.querySelector('facet-filters-form .facets, .facets-wrapper, .facets-container');
        const fallbackNew = doc.querySelector('facet-filters-form .facets, .facets-wrapper, .facets-container');
        
        if (fallbackCurrent && fallbackNew) {
          console.log('Using fallback containers');
          this.replaceFilterContent(fallbackCurrent, fallbackNew);
        } else {
          console.error('No filter containers found to update');
          this.debugAvailableContainers();
        }
        return;
      }
      
      // Replace the entire FacetsWrapperDesktop content with the new structure while preserving styling
      this.replaceFilterContent(currentContainer, newContainer);
      
    } catch (error) {
      console.error('Error updating filter options:', error);
    }
  }
  
  // Replace filter content and reinitialize all components
  replaceFilterContent(currentContainer, newContainer) {
    try {
      // Store current state
      const scrollPosition = window.scrollY;
      const currentForm = document.getElementById('FacetFiltersForm');
      const formData = currentForm ? new FormData(currentForm) : null;
      
      console.log('Replacing filter content within FacetsWrapperDesktop structure...');
      
      // Preserve the main structure but update the dynamic content
      // The structure includes: active-facets, details sections for each filter type
      
      // Clean the new content thoroughly - remove all scripts but preserve inline styles and functionality
      const newContent = this.stripScriptsFromHTML(newContainer.innerHTML);
      
      // Replace the entire content to ensure complete sync with search results
      currentContainer.innerHTML = newContent;
      
      console.log('Filter content replaced, now restoring state and reinitializing...');
      
      // Restore any selected filters that still exist in the new structure
      if (formData && currentForm) {
        this.restoreFilterState(formData);
      }
      
      // Reinitialize all filter components to ensure they work with the new structure
      this.reinitializeAllFilterComponents();
      
      // Restore scroll position
      window.scrollTo(0, scrollPosition);
      
      console.log('Filter content replaced and reinitialized successfully - facets should now be dynamic');
      
    } catch (error) {
      console.error('Error replacing filter content:', error);
    }
  }
  
  // Restore filter state from form data
  restoreFilterState(formData) {
    try {
      const currentForm = document.getElementById('FacetFiltersForm');
      if (!currentForm) return;
      
      for (let [name, value] of formData.entries()) {
        const input = currentForm.querySelector(`input[name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`);
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = true;
          } else if (input.type === 'hidden' || input.type === 'text' || input.type === 'range') {
            input.value = value;
          }
        }
      }
      
      console.log('Filter state restored');
    } catch (error) {
      console.error('Error restoring filter state:', error);
    }
  }
  
  // Comprehensive reinitialization of all filter components
  reinitializeAllFilterComponents() {
    try {
      // Reinitialize price slider
      this.reinitializePriceSlider();
      
      // Reinitialize show more/less buttons
      this.reinitializeShowMoreButtons();
      
      // Reinitialize collapsible filter sections (plus/minus icons)
      this.reinitializeCollapsibleSections();
      
      // Reinitialize any custom filter interactions
      this.reinitializeCustomFilterInteractions();
      
      // Reinitialize product forms and add to cart functionality
      this.reinitializeProductForms();
      
      // Trigger any theme-specific reinitializations
      this.triggerThemeReinitializations();
      
      console.log('All filter components reinitialized');
      
    } catch (error) {
      console.error('Error reinitializing filter components:', error);
    }
  }
  
  // Reinitialize price slider functionality
  reinitializePriceSlider() {
    try {
      // Look for price-range custom elements that need reinitialization
      const priceRangeElements = document.querySelectorAll('price-range');
      
      if (priceRangeElements.length === 0) {
        console.log('No price-range elements found to reinitialize');
        return;
      }
      
      priceRangeElements.forEach(priceRange => {
        // Check if this element has already been initialized
        if (priceRange._priceRangeInitialized) return;
        
        // Manually implement PriceRange functionality
        const inputs = priceRange.querySelectorAll('input');
        
        if (inputs.length === 0) return;
        
        // Helper functions matching the PriceRange class
        const setMinAndMaxValues = () => {
          const minInput = inputs[0];
          const maxInput = inputs[1];
          if (!minInput || !maxInput) return;
          
          if (maxInput.value) minInput.setAttribute('data-max', maxInput.value);
          if (minInput.value) maxInput.setAttribute('data-min', minInput.value);
          if (minInput.value === '') maxInput.setAttribute('data-min', 0);
          if (maxInput.value === '') minInput.setAttribute('data-max', maxInput.getAttribute('data-max'));
        };
        
        const adjustToValidValues = (input) => {
          const value = Number(input.value);
          const min = Number(input.getAttribute('data-min'));
          const max = Number(input.getAttribute('data-max'));
          
          if (value < min) input.value = min;
          if (value > max) input.value = max;
        };
        
        const onRangeChange = (event) => {
          adjustToValidValues(event.currentTarget);
          setMinAndMaxValues();
        };
        
        const onKeyDown = (event) => {
          if (event.metaKey) return;
          const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/;
          if (!event.key.match(pattern)) event.preventDefault();
        };
        
        // Remove existing listeners and add fresh ones
        inputs.forEach((input) => {
          // Clone to remove all existing listeners
          const newInput = input.cloneNode(true);
          input.parentNode.replaceChild(newInput, input);
          
          // Add fresh event listeners
          newInput.addEventListener('change', onRangeChange);
          newInput.addEventListener('keydown', onKeyDown);
        });
        
        // Set initial min/max values
        setMinAndMaxValues();
        
        // Mark as initialized
        priceRange._priceRangeInitialized = true;
      });
      
      console.log('Price range elements reinitialized:', priceRangeElements.length);
    } catch (error) {
      console.error('Error reinitializing price range:', error);
    }
  }
  
  // Reinitialize show more/less button functionality
  reinitializeShowMoreButtons() {
    try {
      const showMoreButtons = document.querySelectorAll('show-more-button button');
      
      showMoreButtons.forEach(button => {
        // Skip if already initialized
        if (button._showMoreInitialized) return;
        
        button._showMoreInitialized = true;
        button.addEventListener('click', function() {
          const container = this.closest('.facets__display-vertical');
          if (!container) return;
          
          const hiddenItems = container.querySelectorAll('.show-more-item.hidden');
          const showMoreLabel = this.querySelector('.label-show-more');
          const showLessLabel = this.querySelector('.label-show-less');
          
          if (hiddenItems.length > 0) {
            // Show hidden items
            hiddenItems.forEach(item => item.classList.remove('hidden'));
            if (showMoreLabel) showMoreLabel.classList.add('hidden');
            if (showLessLabel) showLessLabel.classList.remove('hidden');
          } else {
            // Hide items beyond the first 10
            const visibleItems = container.querySelectorAll('.show-more-item:not(.hidden)');
            visibleItems.forEach((item, index) => {
              if (index >= 10) {
                item.classList.add('hidden');
              }
            });
            if (showMoreLabel) showMoreLabel.classList.remove('hidden');
            if (showLessLabel) showLessLabel.classList.add('hidden');
          }
        });
      });
      
      console.log('Show more buttons reinitialized');
    } catch (error) {
      console.error('Error reinitializing show more buttons:', error);
    }
  }
  
  // Reinitialize collapsible sections (details elements with plus/minus icons)
  reinitializeCollapsibleSections() {
    try {
      // Reinitialize the exact plus/minus icon functionality from the structure provided
      const detailsElements = document.querySelectorAll('details.js-filter');
      
      detailsElements.forEach(details => {
        // Remove any existing listeners to avoid duplicates
        if (details._iconInitialized) {
          details._iconInitialized = false;
        }
        
        const summary = details.querySelector('summary');
        const verticalLine = summary && summary.querySelector('.facets__plus-vertical');
        
        if (verticalLine) {
          details._iconInitialized = true;
          
          // Define the update function exactly as in the provided structure
          function updateIcon() {
            if (details.open) {
              verticalLine.style.transform = 'rotate(-90deg)';
              verticalLine.style.opacity = '0';
            } else {
              verticalLine.style.transform = 'rotate(0deg)';
              verticalLine.style.opacity = '1';
            }
          }
          
          // Remove existing listeners and add new one
          details.removeEventListener('toggle', updateIcon);
          details.addEventListener('toggle', updateIcon);
          updateIcon(); // Set initial state based on current open/closed state
        }
      });
      
      console.log(`Collapsible sections reinitialized for ${detailsElements.length} filter sections`);
    } catch (error) {
      console.error('Error reinitializing collapsible sections:', error);
    }
  }
  
  // Reinitialize any custom filter interactions
  reinitializeCustomFilterInteractions() {
    try {
      // Custom checkbox interactions
      const facetCheckboxes = document.querySelectorAll('.facet-checkbox input[type="checkbox"]');
      facetCheckboxes.forEach(checkbox => {
        if (!checkbox._customInitialized) {
          checkbox._customInitialized = true;
          
          // Add any custom checkbox behavior here if needed
          checkbox.addEventListener('change', function() {
            // Update visual state, analytics, etc.
            const label = this.closest('.facet-checkbox');
            if (label) {
              label.classList.toggle('checked', this.checked);
            }
          });
        }
      });
      
      console.log('Custom filter interactions reinitialized');
    } catch (error) {
      console.error('Error reinitializing custom filter interactions:', error);
    }
  }

  // Reinitialize product forms and add to cart functionality
  reinitializeProductForms() {
    try {
      // Wait for custom elements to be defined
      const waitForCustomElements = async () => {
        const elementsToWait = ['product-form'];
        
        // Check if quick-add-bulk is used
        if (document.querySelector('quick-add-bulk')) {
          elementsToWait.push('quick-add-bulk');
        }
        
        for (const elementName of elementsToWait) {
          if (!customElements.get(elementName)) {
            console.log(`Waiting for ${elementName} to be defined...`);
            await customElements.whenDefined(elementName).catch(() => {
              console.warn(`${elementName} custom element not available`);
            });
          }
        }
      };
      
      waitForCustomElements().then(() => {
        // Reinitialize product-form custom elements
        const productForms = document.querySelectorAll('product-form');
        
        productForms.forEach(form => {
          // Check if this form has already been initialized
          if (form._productFormInitialized) return;
          
          // Ensure the form is connected and ready
          if (form.isConnected && customElements.get('product-form')) {
            // Force a re-initialization by temporarily disconnecting and reconnecting
            const parent = form.parentNode;
            const nextSibling = form.nextSibling;
            
            parent.removeChild(form);
            setTimeout(() => {
              parent.insertBefore(form, nextSibling);
              form._productFormInitialized = true;
            }, 10);
          }
        });
        
        // Reinitialize quick-add-bulk elements
        const quickAddBulkElements = document.querySelectorAll('quick-add-bulk');
        
        quickAddBulkElements.forEach(element => {
          if (element._quickAddBulkInitialized) return;
          
          if (element.isConnected && customElements.get('quick-add-bulk')) {
            const parent = element.parentNode;
            const nextSibling = element.nextSibling;
            
            parent.removeChild(element);
            setTimeout(() => {
              parent.insertBefore(element, nextSibling);
              element._quickAddBulkInitialized = true;
            }, 10);
          }
        });
        
        console.log(`Product forms reinitialized: ${productForms.length} forms, ${quickAddBulkElements.length} quick-add elements`);
      });
      
      // Also reinitialize any quantity selectors or variant selectors immediately
      const quantityInputs = document.querySelectorAll('.quantity input[type="number"]');
      quantityInputs.forEach(input => {
        if (!input._quantityInitialized) {
          // Add min value validation
          input.addEventListener('change', function() {
            if (this.value < 1) this.value = 1;
          });
          input._quantityInitialized = true;
        }
      });
      
    } catch (error) {
      console.error('Error reinitializing product forms:', error);
    }
  }
  
  // Trigger theme-specific reinitializations
  triggerThemeReinitializations() {
    try {
      // Dispatch custom events that the theme might listen for
      document.dispatchEvent(new CustomEvent('facets:updated'));
      document.dispatchEvent(new CustomEvent('facets:reinitialized'));
      
      // Call any global theme functions that might need to run
      if (typeof window.theme !== 'undefined' && window.theme.initializeFacets) {
        window.theme.initializeFacets();
      }
      
      console.log('Theme reinitializations triggered');
    } catch (error) {
      console.error('Error triggering theme reinitializations:', error);
    }
  }
  
  // Debug available containers when the expected ones aren't found
  debugAvailableContainers() {
    console.log('=== DEBUG: Available filter containers ===');
    
    const allContainers = document.querySelectorAll('[class*="facet"], [id*="facet"], [class*="filter"], [id*="Filter"], [id*="Facet"]');
    
    if (allContainers.length === 0) {
      console.log('No filter-related containers found');
    } else {
      console.log(`Found ${allContainers.length} potential filter containers:`);
      allContainers.forEach((el, i) => {
        console.log(`${i + 1}. ${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}`);
      });
    }
  }

  // Replace ALL facet roots 1:1 from the fetched doc
  replaceAllFacetRoots(doc) {
    console.log('Replacing all facet roots...');
    
    // Pairs of [selectorInPage, selectorInDoc]
    const pairs = [
      // Desktop facets (main)
      ['facet-filters-form.facets.small-hide > form#FacetFiltersForm', 'facet-filters-form.facets.small-hide > form#FacetFiltersForm'],
      // Desktop "pills" strip when filter_type == 'drawer'
      ['facet-filters-form.facets.facets-pill > form#FacetFiltersPillsForm', 'facet-filters-form.facets.facets-pill > form#FacetFiltersPillsForm'],
      // Drawer sort form when filter_type == 'drawer'
      ['form#FacetSortDrawerForm', 'form#FacetSortDrawerForm'],
      // Active facets desktop (vertical/horizontal)
      ['.active-facets.active-facets-desktop', '.active-facets.active-facets-desktop'],
      // Active facets mobile
      ['.active-facets.active-facets-mobile', '.active-facets.active-facets-mobile'],
      // Product count (desktop)
      ['#ProductCountDesktop', '#ProductCountDesktop'],
      // Mobile drawer inner facets
      ['menu-drawer details facet-filters-form form#FacetFiltersFormMobile', 'menu-drawer details facet-filters-form form#FacetFiltersFormMobile'],
      // Fallback for the main facets wrapper
      ['#FacetsWrapperDesktop', '#FacetsWrapperDesktop']
    ];

    pairs.forEach(([currentSel, newSel]) => {
      const currentEl = document.querySelector(currentSel);
      const newEl = doc.querySelector(newSel);
      
      if (!currentEl || !newEl) {
        console.log(`Skipping ${currentSel} - not found in current:${!!currentEl} or new:${!!newEl}`);
        return;
      }

      console.log(`Replacing ${currentSel}`);

      // Preserve reference to parent custom element if any
      const isInsideFacetFilters = currentEl.closest('facet-filters-form');

      // Replace the whole node to avoid stale state
      const clone = newEl.cloneNode(true);
      // Avoid re-including any inline scripts
      clone.querySelectorAll('script').forEach(s => s.remove());

      currentEl.replaceWith(clone);

      // If we replaced a child of a custom element, "upgrade" to ensure CE callbacks run on the new subtree
      if (isInsideFacetFilters && window.customElements && window.customElements.upgrade) {
        try {
          window.customElements.upgrade(isInsideFacetFilters);
        } catch(e) {
          console.warn('Custom element upgrade failed:', e);
        }
      }
    });
    
    console.log('Facet roots replacement complete');
  }

  // Update both desktop and mobile product counts
  updateResultCount(doc) {
    const pairs = [
      ['#ProductCountDesktop', '#ProductCountDesktop'],
      ['#ProductCount', '#ProductCount'],
    ];
    
    pairs.forEach(([curr, fresh]) => {
      const currentEl = document.querySelector(curr);
      const newEl = doc.querySelector(fresh);
      if (currentEl && newEl) {
        console.log(`Updating result count: ${curr}`);
        currentEl.innerHTML = newEl.innerHTML;
      }
    });
  }

  // Update facets while preserving all styling and CSS classes
  updateFacetsWithStyling(currentContainer, newContainer) {
    try {
      // Find all filter sections (details elements) in both containers
      const currentFilters = currentContainer.querySelectorAll('details.js-filter, .facets__disclosure, .mobile-facets__details');
      const newFilters = newContainer.querySelectorAll('details.js-filter, .facets__disclosure, .mobile-facets__details');
      
      // Create a map of new filters by their filter type (e.g., filter.v.option.color)
      const newFilterMap = new Map();
      newFilters.forEach(filter => {
        const filterForm = filter.querySelector('form');
        const firstInput = filter.querySelector('input[name*="filter."]');
        if (firstInput && firstInput.name) {
          // Extract filter type from input name (e.g., "filter.v.option.color" from "filter.v.option.color")
          const filterType = firstInput.name.split('.').slice(0, -1).join('.');
          newFilterMap.set(filterType, filter);
        }
      });
      
      // Update each current filter section
      currentFilters.forEach(currentFilter => {
        const currentForm = currentFilter.querySelector('form');
        const currentFirstInput = currentFilter.querySelector('input[name*="filter."]');
        
        if (currentFirstInput && currentFirstInput.name) {
          const filterType = currentFirstInput.name.split('.').slice(0, -1).join('.');
          const newFilter = newFilterMap.get(filterType);
          
          if (newFilter) {
            // Found matching filter in search results - update content while preserving structure
            this.updateFilterSectionContent(currentFilter, newFilter);
          } else {
            // This filter type not available in search results - hide it
            currentFilter.style.display = 'none';
          }
        }
      });
      
      // Show any filter sections that might have been hidden
      currentFilters.forEach(filter => {
        const filterForm = filter.querySelector('form');
        const firstInput = filter.querySelector('input[name*="filter."]');
        if (firstInput && firstInput.name) {
          const filterType = firstInput.name.split('.').slice(0, -1).join('.');
          if (newFilterMap.has(filterType)) {
            filter.style.display = '';
          }
        }
      });
      
    } catch (error) {
      console.error('Error updating facets with styling:', error);
    }
  }

  // Update individual filter section content while preserving styling
  updateFilterSectionContent(currentFilter, newFilter) {
    try {
      // Preserve the original classes and attributes of the current filter
      const originalClasses = currentFilter.className;
      const originalAttributes = {};
      Array.from(currentFilter.attributes).forEach(attr => {
        if (attr.name !== 'class') {
          originalAttributes[attr.name] = attr.value;
        }
      });
      
      // Get the new content (just the options)
      const newContent = newFilter.innerHTML;
      
      // Update the content
      currentFilter.innerHTML = this.stripScriptsFromHTML(newContent);
      
      // Restore all original styling
      currentFilter.className = originalClasses;
      Object.keys(originalAttributes).forEach(attrName => {
        currentFilter.setAttribute(attrName, originalAttributes[attrName]);
      });
      
      // Also preserve styling on child elements
      this.preserveChildElementStyling(currentFilter, newFilter);
      
    } catch (error) {
      console.error('Error updating filter section content:', error);
    }
  }

  // Preserve styling on important child elements
  preserveChildElementStyling(currentFilter, newFilter) {
    try {
      // Preserve summary styling
      const currentSummary = currentFilter.querySelector('summary');
      const newSummary = newFilter.querySelector('summary');
      if (currentSummary && newSummary) {
        const summaryClasses = newSummary.className || currentSummary.className;
        if (summaryClasses) {
          currentSummary.className = summaryClasses;
        }
      }
      
      // Preserve form styling
      const currentForm = currentFilter.querySelector('form');
      const newForm = newFilter.querySelector('form');
      if (currentForm && newForm) {
        const formClasses = newForm.className || currentForm.className;
        if (formClasses) {
          currentForm.className = formClasses;
        }
      }
      
      // Preserve list styling
      const currentList = currentFilter.querySelector('.facets__list, .mobile-facets__list');
      const newList = newFilter.querySelector('.facets__list, .mobile-facets__list');
      if (currentList && newList) {
        const listClasses = newList.className || currentList.className;
        if (listClasses) {
          currentList.className = listClasses;
        }
      }
      
      // Preserve individual option styling
      const currentOptions = currentFilter.querySelectorAll('.facets__item, .mobile-facets__item, li');
      const newOptions = newFilter.querySelectorAll('.facets__item, .mobile-facets__item, li');
      
      currentOptions.forEach((currentOption, index) => {
        if (newOptions[index]) {
          const optionClasses = newOptions[index].className || currentOption.className;
          if (optionClasses) {
            currentOption.className = optionClasses;
          }
        }
      });
      
    } catch (error) {
      console.error('Error preserving child element styling:', error);
    }
  }

  // Fallback method: show all available filters from search results
  showAllAvailableFilters(doc) {
    try {
      console.log('Using fallback filter update method...');
      
      // Find any filter containers in the search results
      const newFilterSections = doc.querySelectorAll('details[id*="Filter"], details.js-filter, .facets details, .facets__disclosure');
      console.log('Found filter sections in search results:', newFilterSections.length);
      
      if (newFilterSections.length > 0) {
        // Find current filter area to update
        const currentFilterArea = document.querySelector('.facets-wrapper, facet-filters-form, .facets');
        
        if (currentFilterArea) {
          // Create a container for the new filters if needed
          let filterContainer = currentFilterArea.querySelector('.dynamic-filters');
          if (!filterContainer) {
            filterContainer = document.createElement('div');
            filterContainer.className = 'dynamic-filters facets';
            currentFilterArea.appendChild(filterContainer);
          }
          
          // Clear existing dynamic filters
          filterContainer.innerHTML = '';
          
          // Add each available filter
          newFilterSections.forEach(filterSection => {
            const clonedFilter = filterSection.cloneNode(true);
            // Remove scripts to prevent errors
            const scripts = clonedFilter.querySelectorAll('script');
            scripts.forEach(script => script.remove());
            
            filterContainer.appendChild(clonedFilter);
          });
          
          console.log('Added', newFilterSections.length, 'filter sections');
          
          // Re-initialize the new filters
          this.reinitializeFacets();
        }
      } else {
        console.warn('No filter sections found in search results');
      }
      
    } catch (error) {
      console.error('Error in fallback filter method:', error);
    }
  }

  // Clear active filters without disrupting DOM structure needed by facets.js
  clearAllActiveFiltersGently() {
    try {
      // Uncheck all active filter inputs
      const activeInputs = document.querySelectorAll('.facets input:checked, .mobile-facets input:checked');
      console.log('Clearing', activeInputs.length, 'active filters');
      activeInputs.forEach(input => {
        input.checked = false;
      });
      
      // Reset price inputs
      const priceMinInput = document.querySelector('input[name="filter.v.price.gte"]');
      const priceMaxInput = document.querySelector('input[name="filter.v.price.lte"]');
      if (priceMinInput) priceMinInput.value = '';
      if (priceMaxInput) priceMaxInput.value = '';
      
      // Hide active filter tags without removing them from DOM
      const activeTags = document.querySelectorAll('.active-facets .active-facets__button, .active-facets-mobile .active-facets__button');
      activeTags.forEach(tag => {
        tag.style.display = 'none';
      });
      
      // Hide clear all buttons
      const clearButtons = document.querySelectorAll('.facets__clear-all, .mobile-facets__clear-all');
      clearButtons.forEach(button => {
        button.style.display = 'none';
      });
      
      // Update URL to remove filter parameters but keep search
      const url = new URL(window.location);
      const searchParam = url.searchParams.get('q');
      
      // Remove all filter parameters
      for (const [key] of url.searchParams.entries()) {
        if (key.startsWith('filter.') || key === 'sort_by') {
          url.searchParams.delete(key);
        }
      }
      
      // Preserve search parameter if it exists
      if (searchParam) {
        url.searchParams.set('q', searchParam);
      }
      
      // Update URL without page reload
      window.history.replaceState({}, '', url);
      
    } catch (error) {
      console.error('Error clearing active filters gently:', error);
    }
  }

  // Completely clear all filters (for conflict resolution)
  clearAllActiveFiltersCompletely() {
    try {
      console.log('Completely clearing all filters due to no results...');
      
      // Uncheck all inputs
      const allInputs = document.querySelectorAll('.facets input, .mobile-facets input');
      allInputs.forEach(input => {
        input.checked = false;
        if (input.type === 'range' || input.type === 'number') {
          input.value = '';
        }
      });
      
      // Clear URL parameters completely except search
      const url = new URL(window.location);
      const searchParam = url.searchParams.get('q');
      
      // Remove all parameters
      url.search = '';
      
      // Re-add only search if it exists
      if (searchParam) {
        url.searchParams.set('q', searchParam);
      }
      
      // Update URL
      window.history.replaceState({}, '', url);
      
    } catch (error) {
      console.error('Error completely clearing filters:', error);
    }
  }

  // Update the count numbers next to each filter option
  updateFilterOptionCounts(doc) {
    try {
      // Get all filter options from the new search results
      const newFilterOptions = doc.querySelectorAll('.facets__list input, .mobile-facets__list input, .facets input, input[name*="filter"]');
      
      if (newFilterOptions.length === 0) {
        return;
      }
      
      let updatedCount = 0;
      
      newFilterOptions.forEach(newInput => {
        if (!newInput.name || !newInput.value) return;
        
        try {
          // Find the corresponding input in the current page
          const currentInput = document.querySelector(`input[name="${CSS.escape(newInput.name)}"][value="${CSS.escape(newInput.value)}"]`);
          
          if (currentInput) {
            // Find the count text element for this filter option
            const newLabel = newInput.closest('label');
            const currentLabel = currentInput.closest('label');
            
            if (newLabel && currentLabel) {
              const newCountText = newLabel.querySelector('.facet-checkbox__text, .facets__label');
              const currentCountText = currentLabel.querySelector('.facet-checkbox__text, .facets__label');
              
              if (newCountText && currentCountText) {
                // Extract just the count part and update it
                const newText = newCountText.textContent.trim();
                const currentText = currentCountText.textContent.trim();
                
                // Extract count from parentheses (e.g., "Color (5)")
                const countMatch = newText.match(/\((\d+)\)$/);
                if (countMatch) {
                  const baseText = currentText.replace(/\s*\(\d+\)$/, '');
                  currentCountText.textContent = baseText + ' (' + countMatch[1] + ')';
                  updatedCount++;
                } else {
                  // If no count in parentheses, just update the whole text
                  currentCountText.textContent = newText;
                  updatedCount++;
                }
              }
            }
          }
        } catch (selectorError) {
          console.warn('Selector error for filter option:', selectorError);
        }
      });
      
    } catch (error) {
      console.error('Error updating filter option counts:', error);
    }
  }

  // Hide/show filter options based on what's available in search results
  updateFilterOptionAvailability(doc) {
    try {
      // Get all available filter values from new search results
      const availableFilters = new Set();
      const newFilterOptions = doc.querySelectorAll('.facets__list input, .mobile-facets__list input');
      
      newFilterOptions.forEach(input => {
        if (input.name && input.value) {
          availableFilters.add(`${input.name}|${input.value}`);
        }
      });
      
      // Check all current filter options and hide/show based on availability
      const currentFilterOptions = document.querySelectorAll('.facets__list input, .mobile-facets__list input');
      
      currentFilterOptions.forEach(input => {
        if (!input.name || !input.value) return;
        
        const filterKey = `${input.name}|${input.value}`;
        const listItem = input.closest('li, .facets__item');
        
        if (listItem) {
          if (availableFilters.has(filterKey)) {
            // Option is available - show it
            listItem.style.display = '';
            listItem.classList.remove('facets__item--disabled');
            input.disabled = false;
          } else {
            // Option is not available - hide it
            listItem.style.display = 'none';
            // Alternative: disable instead of hide
            // listItem.classList.add('facets__item--disabled');
            // input.disabled = true;
          }
        }
      });
      
    } catch (error) {
      console.error('Error updating filter option availability:', error);
    }
  }

  // Update the counts in filter section headers (e.g., "Color (3)")
  updateFilterSectionCounts(doc) {
    try {
      // Get filter sections from new results
      const newFilterSections = doc.querySelectorAll('.facets details, .mobile-facets details');
      
      newFilterSections.forEach(newSection => {
        const sectionId = newSection.id;
        if (!sectionId) return;
        
        // Find corresponding section in current page
        const currentSection = document.getElementById(sectionId);
        if (!currentSection) return;
        
        // Update the summary count
        const newSummary = newSection.querySelector('summary');
        const currentSummary = currentSection.querySelector('summary');
        
        if (newSummary && currentSummary) {
          // Look for count indicators in the summary
          const newSelected = newSummary.querySelector('.facets__selected');
          const currentSelected = currentSummary.querySelector('.facets__selected');
          
          if (newSelected && currentSelected) {
            currentSelected.textContent = newSelected.textContent;
          }
          
          // Update any pill counts
          const newPill = newSummary.querySelector('.facets__pill');
          const currentPill = currentSummary.querySelector('.facets__pill');
          
          if (newPill && currentPill) {
            currentPill.textContent = newPill.textContent;
          }
        }
      });
      
    } catch (error) {
      console.error('Error updating filter section counts:', error);
    }
  }

  // Clear all active filters when search updates
  clearAllActiveFilters() {
    try {
      // Clear all checked inputs in facets
      const activeInputs = document.querySelectorAll('.facets input:checked, .mobile-facets input:checked');
      activeInputs.forEach(input => {
        input.checked = false;
      });
      
      // Clear active filter tags
      const activeTags = document.querySelectorAll('.active-facets .active-facets__button, .active-facets-mobile .active-facets__button');
      activeTags.forEach(tag => tag.remove());
      
      // Hide "Clear all" button
      const clearButtons = document.querySelectorAll('.facets__clear-all, .mobile-facets__clear-all');
      clearButtons.forEach(button => {
        button.style.display = 'none';
      });
      
    } catch (error) {
      console.error('Error clearing active filters:', error);
    }
  }

  // Helper to get element attributes
  getElementAttributes(element) {
    const attributes = {};
    Array.from(element.attributes).forEach(attr => {
      if (attr.name !== 'class') { // Don't include class as we handle it separately
        attributes[attr.name] = attr.value;
      }
    });
    return attributes;
  }

  // Helper to set element attributes
  setElementAttributes(element, attributes) {
    Object.keys(attributes).forEach(attrName => {
      element.setAttribute(attrName, attributes[attrName]);
    });
  }

  // Legacy methods - simplified approach above
  clearConflictingFilters() {
    // Functionality moved to clearAllActiveFilters
  }

  updateFacetsContainer(doc) {
    // Functionality moved to updateFilterOptions
  }

  updateFilterSectionsWithStyling(currentContainer, newContainer) {
    // Functionality moved to updateFilterOptions
  }

  // Find current filter by ID with multiple fallback patterns
  findCurrentFilterById(container, filterId) {
    // Try exact match first
    let filter = container.querySelector(`#${CSS.escape(filterId)}`);
    
    if (!filter) {
      // Try without '-main-search' suffix
      const baseId = filterId.replace('-main-search', '');
      filter = container.querySelector(`#${CSS.escape(baseId)}`);
    }
    
    if (!filter) {
      // Try with '-main-search' suffix if not present
      const mainSearchId = filterId.includes('-main-search') ? filterId : filterId + '-main-search';
      filter = container.querySelector(`#${CSS.escape(mainSearchId)}`);
    }
    
    if (!filter) {
      // Try with other common suffixes
      const patterns = ['-desktop', '-mobile', '-sidebar'];
      for (const pattern of patterns) {
        const altId = filterId.replace(pattern, '') + pattern;
        filter = container.querySelector(`#${CSS.escape(altId)}`);
        if (filter) break;
      }
    }
    
    return filter;
  }

  // Update filter content while preserving exact DOM structure and classes
  updateFilterContentPreservingStructure(currentFilter, newFilter) {
    try {
      // Store the current open state
      const wasOpen = currentFilter.hasAttribute('open');
      
      // Update filter options list while preserving the wrapper structure
      const currentList = currentFilter.querySelector('.facets__list, .mobile-facets__list, .facets__display');
      const newList = newFilter.querySelector('.facets__list, .mobile-facets__list, .facets__display');
      
      if (currentList && newList) {
        // Store all the original classes and attributes of the list container
        const originalClasses = currentList.className;
        const originalAttributes = {};
        Array.from(currentList.attributes).forEach(attr => {
          originalAttributes[attr.name] = attr.value;
        });
        
        // Update only the inner HTML (the actual filter options)
        currentList.innerHTML = newList.innerHTML;
        
        // Restore the original classes and attributes
        currentList.className = originalClasses;
        Object.keys(originalAttributes).forEach(attrName => {
          currentList.setAttribute(attrName, originalAttributes[attrName]);
        });
      }
      
      // Update the summary count if present, but preserve summary structure
      const currentSummary = currentFilter.querySelector('summary');
      const newSummary = newFilter.querySelector('summary');
      
      if (currentSummary && newSummary) {
        // Only update the count part, preserve everything else
        const currentCount = currentSummary.querySelector('.facets__selected, .mobile-facets__selected');
        const newCount = newSummary.querySelector('.facets__selected, .mobile-facets__selected');
        
        if (currentCount && newCount) {
          currentCount.innerHTML = newCount.innerHTML;
        }
        
        // Update any pill count displays
        const currentPill = currentSummary.querySelector('.facets__pill, .mobile-facets__pill');
        const newPill = newSummary.querySelector('.facets__pill, .mobile-facets__pill');
        
        if (currentPill && newPill) {
          currentPill.innerHTML = newPill.innerHTML;
        }
      }
      
      // Restore the open state
      if (wasOpen) {
        currentFilter.setAttribute('open', '');
      } else {
        currentFilter.removeAttribute('open');
      }
      
    } catch (error) {
      console.error('Error updating filter content while preserving structure:', error);
    }
  }

  // Update filter availability and counts without changing structure
  updateFilterAvailabilityAndCounts(currentContainer, newContainer) {
    try {
      // Find all filter options in current container
      const currentOptions = currentContainer.querySelectorAll('.facets__list li, .mobile-facets__list li');
      
      currentOptions.forEach(currentOption => {
        const input = currentOption.querySelector('input');
        if (!input || !input.name || !input.value) return;
        
        try {
          // Find the corresponding option in new container
          const newOption = this.findMatchingFilterOption(newContainer, input.name, input.value);
          
          if (newOption) {
            // Option is available - ensure it's visible and update count
            currentOption.style.display = '';
            currentOption.classList.remove('facets__item--disabled');
            
            // Update count if present
            const currentCount = currentOption.querySelector('.facet-checkbox__text, .facets__count');
            const newCount = newOption.querySelector('.facet-checkbox__text, .facets__count');
            
            if (currentCount && newCount) {
              // Only update the count part, preserve the label text
              const currentText = currentCount.textContent;
              const newText = newCount.textContent;
              
              // Extract count from parentheses
              const countMatch = newText.match(/\((\d+)\)$/);
              if (countMatch) {
                const baseText = currentText.replace(/\s*\(\d+\)$/, '');
                currentCount.textContent = baseText + ' (' + countMatch[1] + ')';
              }
            }
            
          } else {
            // Option is not available - hide or disable it
            currentOption.style.display = 'none';
            // Alternative: disable instead of hide
            // currentOption.classList.add('facets__item--disabled');
            // input.disabled = true;
          }
          
        } catch (optionError) {
          console.warn('Error updating filter option:', optionError.message);
        }
      });
      
    } catch (error) {
      console.error('Error updating filter availability and counts:', error);
    }
  }

  // Find matching filter option in new container
  findMatchingFilterOption(container, inputName, inputValue) {
    try {
      // Use CSS.escape to handle special characters in selectors
      const escapedName = CSS.escape(inputName);
      const escapedValue = CSS.escape(inputValue);
      
      const input = container.querySelector(`input[name="${escapedName}"][value="${escapedValue}"]`);
      return input ? input.closest('li, .facets__item, .mobile-facets__item') : null;
      
    } catch (selectorError) {
      // If CSS selector fails due to complex values, try alternative approach
      const allInputs = container.querySelectorAll('input');
      for (const input of allInputs) {
        if (input.name === inputName && input.value === inputValue) {
          return input.closest('li, .facets__item, .mobile-facets__item');
        }
      }
      return null;
    }
  }

  // Get which filters are currently open
  getOpenFilterState(container) {
    const openFilters = new Set();
    const openDetails = container.querySelectorAll('details[open]');
    openDetails.forEach(detail => {
      if (detail.id) {
        openFilters.add(detail.id);
      }
    });
    return openFilters;
  }

  // Restore which filters should be open
  restoreOpenFilterState(container, openFilters) {
    openFilters.forEach(filterId => {
      const filterElement = container.querySelector(`#${CSS.escape(filterId)}`);
      if (filterElement) {
        filterElement.setAttribute('open', '');
      }
    });
  }

  // Update active facets display - hands-off approach to preserve DOM structure
  updateActiveFacetsDisplay(doc) {
    try {
      // Let Shopify's native facets.js handle all active facets display
      // We don't touch the DOM structure to avoid "Target element not found" errors
      console.log('Preserving active facets DOM structure for facets.js compatibility');
      
    } catch (error) {
      console.error('Error updating active facets display:', error);
    }
  }

  // Check if search has results
  checkIfSearchHasResults(doc) {
    const productGrid = doc.querySelector('#ProductGridContainer .grid');
    const products = productGrid?.querySelectorAll('.grid__item');
    return products && products.length > 0;
  }

    // Legacy method - now handled by updateFacetsContainer
  updateIndividualFilterLists(doc) {
    // This method is now handled by updateFacetsContainer
    // Keeping for compatibility but functionality moved
  }

  // Legacy method - now handled by updateFacetsContainer  
  updateFilterCounts(doc) {
    // This method is now handled by updateFacetsContainer
    // Keeping for compatibility but functionality moved
  }

  // Get currently selected values from a filter section
  getCurrentSelections(filterSection) {
    const selections = new Map();
    
    const checkedInputs = filterSection.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked');
    checkedInputs.forEach(input => {
      selections.set(input.name + '|' + input.value, {
        type: 'input',
        checked: true
      });
    });
    
    const selects = filterSection.querySelectorAll('select');
    selects.forEach(select => {
      if (select.value && select.value !== '') {
        selections.set(select.name + '|' + select.value, {
          type: 'select',
          value: select.value
        });
      }
    });
    
    return selections;
  }

  // Restore selections in the updated filter list
  restoreSelections(filterList, selections) {
    selections.forEach((selectionData, key) => {
      const [name, value] = key.split('|');
      
      if (selectionData.type === 'input') {
        const input = filterList.querySelector(`input[name="${name}"][value="${value}"]`);
        if (input) {
          input.checked = true;
          // Trigger change event to update any dependent UI
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else if (selectionData.type === 'select') {
        const select = filterList.querySelector(`select[name="${name}"]`);
        if (select) {
          const option = select.querySelector(`option[value="${value}"]`);
          if (option) {
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    });
  }

  // Reinitialize JavaScript components after updating filter content
  reinitializeComponents() {
    try {
      // Reinitialize details/summary elements for proper expand/collapse
      const detailsElements = document.querySelectorAll('.js-filter details, .facets details');
      detailsElements.forEach(details => {
        // Ensure proper CSS classes are present
        if (!details.classList.contains('js-filter')) {
          const parentWrapper = details.closest('.js-filter');
          if (parentWrapper) {
            // The parent has the js-filter class, that's fine
          } else {
            // Add js-filter class if missing
            details.classList.add('js-filter');
          }
        }
        
        // Make sure click events are properly bound
        const summary = details.querySelector('summary');
        if (summary && !summary.hasAttribute('data-initialized')) {
          summary.setAttribute('data-initialized', 'true');
          
          // Ensure proper CSS classes on summary
          if (!summary.classList.contains('facets__summary')) {
            summary.classList.add('facets__summary');
          }
          
          summary.addEventListener('click', (e) => {
            // Let the default behavior handle the details toggling
            // but ensure proper focus management
            setTimeout(() => {
              if (details.hasAttribute('open')) {
                const firstInput = details.querySelector('input, select');
                if (firstInput) {
                  firstInput.focus();
                }
              }
            }, 10);
          });
        }
      });
      
      // Reinitialize facet form functionality
      const facetForms = document.querySelectorAll('.facets-form, #FacetFiltersFormMobile');
      facetForms.forEach(form => {
        if (!form.hasAttribute('data-search-initialized')) {
          form.setAttribute('data-search-initialized', 'true');
          
          // Ensure proper form classes
          if (!form.classList.contains('facets-form')) {
            form.classList.add('facets-form');
          }
          
          form.addEventListener('input', (e) => {
            // Debounce facet updates to work with live search
            clearTimeout(this.facetUpdateTimeout);
            this.facetUpdateTimeout = setTimeout(() => {
              // Only trigger if it's not a search-initiated update
              if (!this.isSearchUpdate) {
                form.dispatchEvent(new Event('facet:update', { bubbles: true }));
              }
            }, 150);
          });
        }
      });
      
      // Reinitialize facet checkboxes and radio buttons
      const facetInputs = document.querySelectorAll('.facets input[type="checkbox"], .facets input[type="radio"], .mobile-facets input[type="checkbox"], .mobile-facets input[type="radio"]');
      facetInputs.forEach(input => {
        if (!input.hasAttribute('data-search-initialized')) {
          input.setAttribute('data-search-initialized', 'true');
          
          // Ensure proper input styling classes
          const label = input.closest('label');
          if (label && !label.classList.contains('facet-checkbox')) {
            label.classList.add('facet-checkbox');
          }
          
          input.addEventListener('change', () => {
            // Update visual state and trigger any necessary updates
            if (label) {
              label.classList.toggle('facet-checkbox--selected', input.checked);
            }
          });
        }
      });
      
      // Reinitialize swatch/color picker functionality if present
      const swatchInputs = document.querySelectorAll('.swatch input[type="radio"], .color-swatch input[type="radio"]');
      swatchInputs.forEach(input => {
        if (!input.hasAttribute('data-search-initialized')) {
          input.setAttribute('data-search-initialized', 'true');
          
          input.addEventListener('change', () => {
            // Update visual state of swatch
            const swatch = input.closest('.swatch, .color-swatch');
            if (swatch) {
              // Remove selected state from siblings
              const siblings = swatch.parentNode.querySelectorAll('.swatch, .color-swatch');
              siblings.forEach(sibling => sibling.classList.remove('selected'));
              
              // Add selected state to current swatch
              if (input.checked) {
                swatch.classList.add('selected');
              }
            }
          });
        }
      });
      
      // Reinitialize any disclosure/toggle components
      const disclosureElements = document.querySelectorAll('[data-disclosure], .disclosure');
      disclosureElements.forEach(element => {
        if (!element.hasAttribute('data-initialized')) {
          element.setAttribute('data-initialized', 'true');
          // Ensure proper disclosure styling
          if (!element.classList.contains('disclosure')) {
            element.classList.add('disclosure');
          }
        }
      });
      
    } catch (error) {
      console.error('Error reinitializing components:', error);
    }
  }

  // Reinitialize product grid components after updating content
  reinitializeProductGridComponents() {
    try {
      if (!this.productGrid) return;
      
      // Reinitialize any quick shop buttons
      const quickShopButtons = this.productGrid.querySelectorAll('.quick-add__submit, .quick-shop__submit');
      quickShopButtons.forEach(button => {
        if (!button.hasAttribute('data-search-initialized')) {
          button.setAttribute('data-search-initialized', 'true');
          // Add any specific quick shop initialization if needed
        }
      });
      
      // Reinitialize any product image hover effects
      const productImages = this.productGrid.querySelectorAll('.card__media img, .media img');
      productImages.forEach(img => {
        if (!img.hasAttribute('data-search-initialized')) {
          img.setAttribute('data-search-initialized', 'true');
          // Ensure proper loading behavior
          if (img.loading !== 'lazy') {
            img.loading = 'lazy';
          }
        }
      });
      
      // Reinitialize any variant pickers in the grid
      const variantPickers = this.productGrid.querySelectorAll('variant-radios, variant-selects');
      variantPickers.forEach(picker => {
        if (!picker.hasAttribute('data-search-initialized')) {
          picker.setAttribute('data-search-initialized', 'true');
          // Trigger any necessary variant picker initialization
          const changeEvent = new Event('change', { bubbles: true });
          picker.dispatchEvent(changeEvent);
        }
      });
      
      // Reinitialize any product card animations or interactions
      const productCards = this.productGrid.querySelectorAll('.card, .product-card');
      productCards.forEach(card => {
        if (!card.hasAttribute('data-search-initialized')) {
          card.setAttribute('data-search-initialized', 'true');
          // Add any card-specific initialization
        }
      });
      
    } catch (error) {
      console.error('Error reinitializing product grid components:', error);
    }
  }

  // Update product counts shown in filter options
  updateFilterCounts(doc) {
    try {
      // Update counts in filter options
      const newCountElements = doc.querySelectorAll('.facets__list .facet-checkbox__text, .mobile-facets__list .facet-checkbox__text');
      
      newCountElements.forEach(newCountElement => {
        try {
          // Try to find the corresponding element in current DOM
          const label = newCountElement.closest('label');
          if (!label) return;
          
          const input = label.querySelector('input');
          if (!input || !input.value || !input.name) return;
          
          // Escape special characters in CSS selector
          const escapedName = CSS.escape(input.name);
          const escapedValue = CSS.escape(input.value);
          
          // Use the escaped values in the selector
          const currentInput = document.querySelector(`input[name="${escapedName}"][value="${escapedValue}"]`);
          if (currentInput) {
            const currentCountElement = currentInput.closest('label')?.querySelector('.facet-checkbox__text');
            if (currentCountElement) {
              // Only update the count part, preserve the text
              const newText = newCountElement.textContent;
              const currentText = currentCountElement.textContent;
              
              // Extract count from parentheses if it exists
              const newCountMatch = newText.match(/\((\d+)\)$/);
              const currentBase = currentText.replace(/\s*\(\d+\)$/, '');
              
              if (newCountMatch) {
                currentCountElement.textContent = currentBase + ' (' + newCountMatch[1] + ')';
              }
            }
          }
        } catch (selectorError) {
          console.warn('Could not update count for filter option:', selectorError.message);
        }
      });
    } catch (error) {
      console.error('Error in updateFilterCounts:', error);
    }
  }

  // Update facets content while preserving currently selected filters
  updateFacetsWithSelectionPreservation(currentContainer, newContent) {
    // Store currently selected values
    const selectedValues = new Map();
    
    // Get all currently checked inputs
    const checkedInputs = currentContainer.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked');
    checkedInputs.forEach(input => {
      selectedValues.set(input.name + '|' + input.value, true);
    });
    
    // Get selected dropdown values
    const selects = currentContainer.querySelectorAll('select');
    selects.forEach(select => {
      if (select.value) {
        selectedValues.set(select.name + '|' + select.value, select.value);
      }
    });
    
    // Update the content
    currentContainer.innerHTML = newContent;
    
    // Restore selections that are still available
    setTimeout(() => {
      selectedValues.forEach((value, key) => {
        const [name, val] = key.split('|');
        
        // For checkboxes and radio buttons
        const input = currentContainer.querySelector(`input[name="${name}"][value="${val}"]`);
        if (input) {
          input.checked = true;
        }
        
        // For select dropdowns
        const select = currentContainer.querySelector(`select[name="${name}"]`);
        if (select && value !== true) {
          const option = select.querySelector(`option[value="${val}"]`);
          if (option) {
            select.value = val;
          }
        }
      });
      
      // Trigger any necessary events for the updated facets
      this.triggerFacetUpdateEvents(currentContainer);
    }, 50);
  }

  // Trigger events needed after facet updates
  triggerFacetUpdateEvents(container) {
    // Trigger change events on updated inputs to ensure UI is synced
    const inputs = container.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked');
    inputs.forEach(input => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // Trigger change events on selects
    const selects = container.querySelectorAll('select');
    selects.forEach(select => {
      if (select.value) {
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  // Check if the search returned any results
  checkForResults(doc) {
    const productGrid = doc.querySelector('#ProductGridContainer .grid.product-grid');
    if (!productGrid) return false;
    
    const products = productGrid.querySelectorAll('li.grid__item');
    return products.length > 0;
  }

  // Check if there are any active filters
  hasActiveFilters() {
    const currentUrl = new URL(window.location);
    const urlParams = new URLSearchParams(currentUrl.search);
    
    // Check for common filter parameters
    for (const [key, value] of urlParams.entries()) {
      if (key.startsWith('filter.') || 
          key === 'sort_by' && value !== 'relevance' ||
          key === 'price_min' || 
          key === 'price_max') {
        return true;
      }
    }
    return false;
  }

  // Perform search without any filters
  async performSearchWithoutFilters(query) {
    try {
      // Simple approach: just clear all active facets and retry search
      await this.clearAllActiveFacets();
      
      // Wait a moment for the clearing to complete
      setTimeout(async () => {
        // Now try the search with no filters
        await this.performCleanSearch(query);
      }, 800);
      
    } catch (error) {
      console.error('Error performing search without filters:', error);
    }
  }

  // Clear all active facets by clicking their remove buttons
  async clearAllActiveFacets() {
    const activeRemoveButtons = document.querySelectorAll('facet-remove a.active-facets__button');
    
    if (activeRemoveButtons.length > 0) {
      console.log(`Clearing ${activeRemoveButtons.length} active facets...`);
      
      // Show notification that filters are being cleared
      this.showFilterClearedNotification();
      
      // Click remove buttons one by one with longer delays to avoid DOM conflicts
      for (let i = 0; i < activeRemoveButtons.length; i++) {
        const button = activeRemoveButtons[i];
        setTimeout(() => {
          // Check if button still exists before clicking (it might have been removed)
          if (button && button.parentNode && document.contains(button)) {
            button.click();
          }
        }, i * 200); // Increased delay to 200ms between clicks
      }
    }
  }

  // Perform a clean search with just the query
  async performCleanSearch(query) {
    try {
      // Create clean URL with only search query
      const cleanParams = new URLSearchParams();
      cleanParams.set('q', query);
      cleanParams.set('options[prefix]', 'last');
      
      const searchUrl = `/search?${cleanParams.toString()}&section_id=main-search`;
      
      // Fetch results without filters
      const response = await fetch(searchUrl);
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newProductGrid = doc.getElementById('ProductGridContainer');
      
      const hasResults = this.checkForResults(doc);
      
      if (hasResults && newProductGrid && this.productGrid) {
        // Update the product grid
        this.productGrid.innerHTML = newProductGrid.innerHTML;
        
        // Update result count
        this.updateResultCount(doc);
        
        console.log('Search completed successfully without filters');
      }
      
    } catch (error) {
      console.error('Error performing clean search:', error);
    }
  }

    // Ensure search input stays in sync with URL parameters after filter changes
  syncSearchWithURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    
    if (this.input && this.input.value !== (queryParam || '')) {
      this.input.value = queryParam || '';
    }
  }

  // Try removing only selected filters
  async trySearchWithSelectedFiltersRemoved(query, filtersToRemove) {
    try {
      const currentUrl = new URL(window.location);
      const urlParams = new URLSearchParams(currentUrl.search);
      
      // Remove the problematic filters
      filtersToRemove.forEach(filter => {
        urlParams.delete(filter.key);
      });
      
      // Keep the search query
      urlParams.set('q', query);
      
      const searchUrl = `/search?${urlParams.toString()}&section_id=main-search`;
      const response = await fetch(searchUrl);
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const hasResults = this.checkForResults(doc);
      
      if (hasResults) {
        const newProductGrid = doc.getElementById('ProductGridContainer');
        if (newProductGrid && this.productGrid) {
          this.productGrid.innerHTML = newProductGrid.innerHTML;
          
          // Update URL with remaining filters
          const newUrl = `/search?${urlParams.toString()}`;
          window.history.replaceState({}, '', newUrl);
          
          // Update result count
          this.updateResultCount(doc);
          
          // Show notification about which filters were cleared
          this.showSelectiveFilterClearedNotification(filtersToRemove);
          
          // Clear only the problematic filters from UI after a delay to avoid conflicts
          setTimeout(() => {
            this.clearSpecificFiltersFromUI(filtersToRemove);
          }, 300);
          
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      console.error('Error trying selective filter removal:', error);
      return false;
    }
  }

  // Perform complete filter clear
  async performCompleteFilterClear(query) {
    try {
      // Create clean URL with only search query
      const cleanParams = new URLSearchParams();
      cleanParams.set('q', query);
      cleanParams.set('options[prefix]', 'last');
      
      const searchUrl = `/search?${cleanParams.toString()}&section_id=main-search`;
      
      // Fetch results without filters
      const response = await fetch(searchUrl);
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newProductGrid = doc.getElementById('ProductGridContainer');
      
      const hasResults = this.checkForResults(doc);
      
      if (hasResults && newProductGrid && this.productGrid) {
        // Update the product grid first
        this.productGrid.innerHTML = newProductGrid.innerHTML;
        
        // Update URL to clean search
        const newUrl = `/search?q=${encodeURIComponent(query)}&options%5Bprefix%5D=last`;
        window.history.replaceState({}, '', newUrl);
        
        // Update result count
        this.updateResultCount(doc);
        
        // Show user feedback
        this.showFilterClearedNotification();
        
        // Clear filter UI gently after a delay to avoid facets.js conflicts
        setTimeout(() => {
          this.clearFilterUI();
        }, 500);
        
        console.log('All filters cleared - found results for search without filters');
      }
      
    } catch (error) {
      console.error('Error performing complete filter clear:', error);
    }
  }

  // Clear specific filters from UI
  clearSpecificFiltersFromUI(filtersToRemove) {
    filtersToRemove.forEach((filter, index) => {
      // Find and trigger removal of active filter display items
      const activeFilterLinks = document.querySelectorAll(`.active-facets a`);
      activeFilterLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href.includes(filter.key) || href.includes(encodeURIComponent(filter.key)))) {
          // Trigger removal through the facets system instead of direct DOM manipulation
          // Stagger the removals to avoid conflicts
          setTimeout(() => {
            link.click();
          }, index * 100);
        }
      });
    });
  }

  // Show notification about selective filter clearing
  showSelectiveFilterClearedNotification(filtersRemoved) {
    const filterNames = filtersRemoved.map(f => f.key.split('.').pop()).join(', ');
    
    const notification = document.createElement('div');
    notification.className = 'filter-cleared-notification';
    notification.innerHTML = `
      <div style="
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: #ffc107; 
        color: #212529; 
        padding: 12px 20px; 
        border-radius: 4px; 
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      ">
        ⚠️ Removed conflicting filters to show search results
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  }

  // Clear the filter UI elements
  clearFilterUI() {
    // This method is now simplified - just clear all active facets
    this.clearAllActiveFacets();
  }

  // Show notification that filters were cleared
  showFilterClearedNotification() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'filter-cleared-notification';
    notification.innerHTML = `
      <div style="
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: #28a745; 
        color: white; 
        padding: 12px 20px; 
        border-radius: 4px; 
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      ">
        ✓ Filters cleared to show search results
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Ensure search input stays in sync with URL parameters after filter changes
  syncSearchWithURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    
    if (this.input && this.input.value !== (queryParam || '')) {
      this.input.value = queryParam || '';
    }
  }
  
  // Watch for URL changes (from filter operations) and sync search input
  setupURLWatcher() {
    let lastUrl = window.location.href;
    
    // Use MutationObserver to detect DOM changes that might indicate filter updates
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.syncSearchWithURL();
      }
    });
    
    // Observe changes to the product grid container
    if (this.productGrid) {
      observer.observe(this.productGrid, { 
        childList: true, 
        subtree: true 
      });
    }
    
    // Also listen for popstate events (browser back/forward)
    window.addEventListener('popstate', () => {
      this.syncSearchWithURL();
    });
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.keepInSync('', this.input);
      // Perform live search with empty query to show all results
      this.performLiveSearch('');
    }
  }

  onInput(event) {
    const target = event.target;
    this.keepInSync(target.value, target);
  }

  onInputFocus() {
    const isSmallScreen = window.innerWidth < 750;
    if (isSmallScreen) {
      this.scrollIntoView({ behavior: 'smooth' });
    }
  }

  keepInSync(value, target) {
    this.allSearchInputs.forEach((input) => {
      if (input !== target) {
        input.value = value;
      }
    });
  }

  // Strip script tags from HTML to prevent redeclaration errors
  stripScriptsFromHTML(htmlString) {
    try {
      // Create a temporary div to manipulate the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;
      
      // Get all script tags for selective removal
      const scripts = tempDiv.querySelectorAll('script');
      scripts.forEach(script => {
        const scriptContent = script.textContent || script.innerText || '';
        
        // Preserve essential filter functionality scripts (like plus/minus toggle scripts)
        if (scriptContent.includes('details.js-filter') || 
            scriptContent.includes('facets__plus-vertical') ||
            scriptContent.includes('updateIcon()') ||
            scriptContent.includes('setupPriceSlider') ||
            scriptContent.includes('price-slider')) {
          console.log('Preserving essential filter script');
          return; // Keep this script
        }
        
        // Remove other scripts that might interfere
        script.remove();
      });
      
      return tempDiv.innerHTML;
    } catch (error) {
      console.warn('Error stripping scripts from HTML:', error);
      // Fallback: use regex but be more selective
      return htmlString.replace(/<script\b(?![^>]*(?:facets__plus|price-slider|details\.js-filter))[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
  }

  // Re-initialize facets after they've been updated
  // NOTE: With the new native Dawn rendering approach, this method is largely obsolete
  // The FacetFiltersForm.renderFilters() method handles all reinitialization automatically
  reinitializeFacets() {
    try {
      // 1. Reinitialize plus icon animations for details.js-filter elements
      this.reinitializePlusIconAnimations();
      
      // 2. Attach to any new forms (desktop, mobile, pills)
      const forms = document.querySelectorAll(
        'facet-filters-form form, .facets form, .mobile-facets form, form#FacetSortDrawerForm'
      );
      forms.forEach((form) => {
        form.removeEventListener('change', this._facetChangeHandler);
        // Keep a bound reference to avoid multiple anonymous functions
        if (!this._facetChangeHandler) {
          this._facetChangeHandler = this.handleFilterChange.bind(this);
        }
        form.addEventListener('change', this._facetChangeHandler);
      });

      // 3. Fire theme hooks
      document.dispatchEvent(new CustomEvent('facets:updated'));
      if (window.customElements && document.querySelector('facet-filters-form')) {
        // Upgrade any newly inserted custom elements
        document.querySelectorAll('facet-filters-form, price-range').forEach(el => {
          try { 
            window.customElements.upgrade(el); 
          } catch(e) {
            console.warn('Custom element upgrade failed:', e);
          }
        });
      }
    } catch (e) {
      console.warn('reinitializeFacets error', e);
    }
  }

  // Reinitialize the plus icon animations for facet details elements
  reinitializePlusIconAnimations() {
    try {
      // This replicates the JavaScript from the facets template
      document.querySelectorAll('details.js-filter').forEach(function (details) {
        var summary = details.querySelector('summary');
        var verticalLine = summary && summary.querySelector('.facets__plus-vertical');
        if (verticalLine) {
          function updateIcon() {
            if (details.open) {
              verticalLine.style.transform = 'rotate(-90deg)';
              verticalLine.style.opacity = '0';
              // Update aria-expanded attribute
              if (summary) {
                summary.setAttribute('aria-expanded', 'true');
              }
            } else {
              verticalLine.style.transform = 'rotate(0deg)';
              verticalLine.style.opacity = '1';
              // Update aria-expanded attribute
              if (summary) {
                summary.setAttribute('aria-expanded', 'false');
              }
            }
          }
          
          // Remove any existing event listeners to avoid duplicates
          details.removeEventListener('toggle', updateIcon);
          details.addEventListener('toggle', updateIcon);
          updateIcon();
        }
      });
      
      // Also reinitialize any show-more custom elements
      document.querySelectorAll('show-more-button').forEach(el => {
        try { 
          if (window.customElements) {
            window.customElements.upgrade(el); 
          }
        } catch(e) {
          console.warn('Show-more element upgrade failed:', e);
        }
      });
      
    } catch (error) {
      console.warn('Error reinitializing plus icon animations:', error);
    }
  }
}

// Initialize MainSearch when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, waiting a bit then initializing MainSearch...');
  // Add a small delay to ensure all elements are fully rendered
  setTimeout(() => {
    new MainSearch();
  }, 100);
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
} else {
  // DOM is already loaded
  console.log('DOM already loaded, waiting a bit then initializing MainSearch...');
  setTimeout(() => {
    new MainSearch();
  }, 100);
}
