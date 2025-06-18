document.addEventListener('DOMContentLoaded', function() {
    // Configuration - Set these values
    const config = {
        formSubmitEmail: 'your-email@universalprinting.com', // Your real email here
        cmsEndpoint: 'https://your-strapi-instance.com/api', // Your Strapi endpoint
        googleAnalyticsId: 'UA-XXXXX-Y' // Your GA ID if using
    };

    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Initialize analytics if configured
    if (config.googleAnalyticsId && config.googleAnalyticsId !== 'UA-XXXXX-Y') {
        initAnalytics(config.googleAnalyticsId);
    }

    // Load dynamic content from CMS
    loadDynamicContent();

    // Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;
    
    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('active');
        body.classList.toggle('no-scroll');
    });
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            body.classList.remove('no-scroll');
        });
    });
    
    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Enhanced Form Submission
    const quoteForm = document.getElementById('quoteForm');
    const thankYouPopup = document.getElementById('thankYouPopup');
    
    if (quoteForm) {
        quoteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            
            try {
                const formData = {
                    name: this.name.value,
                    email: this.email.value,
                    phone: this.phone.value,
                    service: this.service.value,
                    message: this.message.value,
                    _subject: 'New Print Quote Request',
                    _template: 'table',
                    _captcha: 'false'
                };
                
                // Send to both FormSubmit and your CRM/webhook
                await Promise.all([
                    sendToFormSubmit(formData, config.formSubmitEmail),
                    sendToCRM(formData)
                ]);
                
                showPopup(thankYouPopup);
                this.reset();
                
                // Track conversion if analytics is enabled
                if (window.gtag) {
                    gtag('event', 'conversion', {
                        'send_to': 'AW-YOUR_CONVERSION_ID/YOUR_LABEL'
                    });
                }
            } catch (error) {
                console.error('Submission error:', error);
                alert('There was an error submitting your request. Please try again or call us directly.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
    
    // Close popup handlers
    document.querySelectorAll('.close-popup, .popup-close-btn').forEach(btn => {
        btn.addEventListener('click', () => closePopup(thankYouPopup));
    });
    
    thankYouPopup.addEventListener('click', function(e) {
        if (e.target === this) closePopup(this);
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && thankYouPopup.classList.contains('active')) {
            closePopup(thankYouPopup);
        }
    });
});

// ========== Helper Functions ========== //

async function loadDynamicContent() {
    try {
        // Example: Load services from CMS
        const servicesResponse = await axios.get(`${config.cmsEndpoint}/services`);
        if (servicesResponse.data && servicesResponse.data.length) {
            renderServices(servicesResponse.data);
        }
        
        // Example: Load portfolio items
        const portfolioResponse = await axios.get(`${config.cmsEndpoint}/portfolio-items`);
        if (portfolioResponse.data && portfolioResponse.data.length) {
            renderPortfolio(portfolioResponse.data);
        }
    } catch (error) {
        console.error('Error loading dynamic content:', error);
    }
}

function renderServices(services) {
    const servicesGrid = document.querySelector('.services-grid');
    if (!servicesGrid) return;
    
    servicesGrid.innerHTML = services.map(service => `
        <div class="service-card">
            <i class="fas ${service.icon}"></i>
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            ${service.price ? `<span class="price">From ${service.price}</span>` : ''}
        </div>
    `).join('');
}

function renderPortfolio(portfolioItems) {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (!portfolioGrid) return;
    
    portfolioGrid.innerHTML = portfolioItems.map(item => `
        <div class="portfolio-item">
            <img src="${item.imageUrl}" alt="${item.title}">
            <div class="portfolio-overlay">
                <h3>${item.title}</h3>
                ${item.description ? `<p>${item.description}</p>` : ''}
            </div>
        </div>
    `).join('');
}

async function sendToFormSubmit(data, email) {
    const response = await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

async function sendToCRM(data) {
    // Example webhook to Zapier/Make.com or direct to CRM
    const webhookUrl = 'https://hook.yourintegration.com/your-unique-id';
    
    try {
        await axios.post(webhookUrl, {
            ...data,
            source: 'Universal Printing Website'
        });
    } catch (error) {
        console.error('CRM integration error:', error);
        // Fail silently as FormSubmit is primary
    }
}

function showPopup(popup) {
    document.body.classList.add('no-scroll');
    popup.classList.add('active');
}

function closePopup(popup) {
    document.body.classList.remove('no-scroll');
    popup.classList.remove('active');
}

function initAnalytics(gaId) {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', gaId);
    
    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
}
const config = {
    formSubmitEmail: 'bereketgalif21@gmail.com.com', // Replace with your email
    cmsEndpoint: 'https://your-cms-api.com/api', // Replace if using a CMS
    googleAnalyticsId: 'UA-XXXXX-Y' // Replace if using Google Analytics
};