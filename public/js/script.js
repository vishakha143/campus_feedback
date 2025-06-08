document.addEventListener('DOMContentLoaded', () => {
  try {
    const sidebarToggles = document.querySelectorAll('.sidebar-container .sidebar-toggle');
    const sidebarClose = document.querySelector('.sidebar-close');

    console.log('Sidebar elements on load:', { sidebarToggles: sidebarToggles.length, sidebarClose: !!sidebarClose });

    // Sidebar Toggle Functionality
    function toggleSidebar(show) {
      const sidebar = document.querySelector('#sidebar');
      const mainContent = document.querySelector('.main-content');

      console.log('toggleSidebar called:', { show, sidebar: !!sidebar, mainContent: !!mainContent });

     if (!sidebar || !mainContent) {
    console.error('Sidebar or mainContent not found during toggleSidebar');
    console.log('All elements with ID sidebar:', document.querySelectorAll('#sidebar'));
    console.log('All elements with class main-content:', document.querySelectorAll('.main-content'));
    return;
      }

      if (show) {
        sidebar.classList.remove('sidebar-hidden');
       if (window.innerWidth >= 768 && mainContent){
          mainContent.style.marginLeft = '250px';
        }
        localStorage.setItem('sidebarState', 'visible');
        sidebarToggles.forEach(toggle => {
          toggle.style.display = 'none'; // Enforce hiding via JavaScript
        });
      } else {
        sidebar.classList.add('sidebar-hidden');
      if (mainContent) {
        mainContent.style.marginLeft = '0';
      }
      localStorage.setItem('sidebarState', 'hidden');
      sidebarToggles.forEach(toggle => {
        toggle.style.display = 'block';
      });
      }
    }

    // Load sidebar state from localStorage
    const sidebar = document.querySelector('#sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarState = localStorage.getItem('sidebarState') || 'visible';
    if (sidebar && mainContent) {
      console.log('Initial sidebarState:', sidebarState, 'Window width:', window.innerWidth);
      if (sidebarState === 'hidden') {
        sidebar.classList.add('sidebar-hidden');
        mainContent.style.marginLeft = '0';
        sidebarToggles.forEach(toggle => {
          toggle.style.display = 'block';
        });
      } else {
        sidebar.classList.remove('sidebar-hidden');
        if (window.innerWidth >= 768) {
          mainContent.style.marginLeft = '250px';
        }
        sidebarToggles.forEach(toggle => {
          toggle.style.display = 'none';
        });
      }
    }

    // Event listener for sidebar toggle button
    if (sidebarToggles.length > 1) {
      console.warn('Multiple sidebar toggles found. Using the first one.');
    }
    sidebarToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        console.log('Sidebar toggle clicked');
        const isHidden = document.querySelector('#sidebar')?.classList.contains('sidebar-hidden') ?? true;
        toggleSidebar(isHidden);
      });
    });

    // Event listener for sidebar close button
    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => {
        console.log("Sidebar is closed"); // Fixed typo in log message
        toggleSidebar(false);
      });
    }

    // Adjust sidebar on window resize
    window.addEventListener('resize', () => {
      const sidebar = document.querySelector('#sidebar');
      const mainContent = document.querySelector('.main-content');
      if (!sidebar || !mainContent) return;
      const sidebarState = localStorage.getItem('sidebarState') || 'visible';
      console.log('Resize - sidebarState:', sidebarState, 'Window width:', window.innerWidth);
      if (window.innerWidth < 768) {
        sidebar.classList.add('sidebar-hidden');
        mainContent.style.marginLeft = '0';
        sidebarToggles.forEach(toggle => {
          toggle.style.display = 'block';
        });
      } else {
        if (sidebarState === 'visible') {
          sidebar.classList.remove('sidebar-hidden');
          mainContent.style.marginLeft = '250px';
          sidebarToggles.forEach(toggle => {
            toggle.style.display = 'none';
          });
        } else {
          sidebar.classList.add('sidebar-hidden');
          mainContent.style.marginLeft = '0';
          sidebarToggles.forEach(toggle => {
            toggle.style.display = 'block';
          });
        }
      }
    });

    // Star rating and form validation code
    document.querySelectorAll('.star-rating').forEach(rating => {
      const field = rating.getAttribute('data-field');
      const input = document.getElementById(field);
      const stars = rating.querySelectorAll('i');

      stars.forEach(star => {
        star.addEventListener('click', () => {
          const value = star.getAttribute('data-value');
          input.value = value;

          stars.forEach(s => {
            if (s.getAttribute('data-value') <= value) {
              s.classList.add('selected');
            } else {
              s.classList.remove('selected');
            }
          });

          input.dispatchEvent(new Event('input'));
        });
      });
    });

    (function () {
      'use strict';
      const forms = document.querySelectorAll('.needs-validation');
      Array.prototype.slice.call(forms).forEach(form => {
        form.addEventListener('submit', event => {
          if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add('was-validated');
        }, false);
      });
    })();
  } catch (err) {
    console.error('Error in sidebar script:', err);
  }
});

document.addEventListener('fullscreenchange', () => {
  const sidebarToggles = document.querySelectorAll('.sidebar-container .sidebar-toggle');
  const sidebarState = localStorage.getItem('sidebarState') || 'visible';
  sidebarToggles.forEach(toggle => {
    toggle.style.display = sidebarState === 'visible' ? 'none' : 'block';
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // Welcome animation
  const welcomeSection = document.querySelector('.welcome-section');
  if (welcomeSection) {
    welcomeSection.style.opacity = '0';
    setTimeout(() => {
      welcomeSection.style.transition = 'opacity 1s ease-in-out';
      welcomeSection.style.opacity = '1';
    }, 500);
  }
});