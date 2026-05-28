import { useEffect, useState } from 'react';
import CardComponent from '../assets/ComponentCard.jsx';
import Footer from '../assets/Footer.jsx';
import NavBar from '../assets/Navbar.jsx';
import '../Stylings/MainPage.css';
import LandingPage from './LandingPage.jsx';

function MainPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState('all');
    const totalSlides = 3;
    const [menuOpen, setMenuOpen] = useState(false);

    // State for company slider
    const [currentCompanySlide, setCurrentCompanySlide] = useState(0);
    // State for laptop company slider
    const [currentLaptopCompanySlide, setCurrentLaptopCompanySlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                setLoadingDevices(true);
                const res = await fetch('http://localhost:5000/api/product', {
                    method: 'GET',
                    credentials: 'include', // Include cookies for authentication
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });


                if (!res.ok) {
                    // Don't redirect to login, just log the error
                    console.error('Failed to fetch products:', res.status);
                    throw new Error('Failed to fetch products');
                }

                const data = await res.json();
                setDevices(data || []);
            } catch (e) {
                console.error('Failed to load devices:', e);
                setDevices([]);
            } finally {
                setLoadingDevices(false);
            }
        };

        fetchDevices();
    }, []);

    const handleDotClick = (index) => {
        setCurrentSlide(index);
    };

    const scrollToNewReleases = () => {
        const newReleasesElement = document.getElementById('new-releases-section');
        if (newReleasesElement) {
            newReleasesElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Predefined list of major companies
    const predefinedCompanies = [
        'Apple',
        'Samsung',
        'Vivo',
        'iQOO',
        'OnePlus',
        'Xiaomi',
        'Redmi',
        'Realme',
        'Oppo',
        'Nothing',
        'Google',
        'Motorola',
        'Nokia',
        'Sony',
        'Asus',
        'Honor'
    ];

    // Filter devices into phones and laptops
    // Assuming phones don't have category 'Laptop' or 'laptop'
    const phoneDevices = devices.filter(d => !d.category || (d.category !== 'Laptop' && d.category !== 'laptop'));
    const laptopDevices = devices.filter(d => d.category === 'Laptop' || d.category === 'laptop');

    // Get unique companies from phone devices and merge with predefined list
    const deviceCompanies = new Set(phoneDevices.map(d => d.company).filter(Boolean));
    const allCompanies = ['all', ...predefinedCompanies, ...deviceCompanies].filter((value, index, self) =>
        self.indexOf(value) === index
    ).sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return a.localeCompare(b);
    });

    // Predefined list of major laptop companies
    const predefinedLaptopCompanies = [
        'Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Razer', 'MSI', 'Samsung', 'Alienware'
    ];

    // Get unique companies from laptop devices
    const laptopDeviceCompanies = new Set(laptopDevices.map(d => d.company).filter(Boolean));
    const allLaptopCompanies = ['all', ...predefinedLaptopCompanies, ...laptopDeviceCompanies].filter((value, index, self) =>
        self.indexOf(value) === index
    ).sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return a.localeCompare(b);
    });

    // Brand-specific keywords mapping for better matching
    const brandKeywords = {
        'apple': ['iphone', 'ipad', 'ipod', 'macbook', 'imac', 'apple'],
        'samsung': ['galaxy', 'samsung', 'note', 's series', 'z fold', 'z flip'],
        'vivo': ['vivo', 'x series', 'y series', 'v series'],
        'iqoo': ['iqoo', 'neo', 'z series'],
        'oneplus': ['oneplus', 'nord'],
        'xiaomi': ['xiaomi', 'mi ', 'redmi note', 'poco'],
        'redmi': ['redmi', 'note'],
        'realme': ['realme', 'gt', 'narzo'],
        'oppo': ['oppo', 'reno', 'find x'],
        'nothing': ['nothing', 'phone'],
        'google': ['pixel', 'google'],
        'motorola': ['motorola', 'moto', 'edge', 'razr'],
        'nokia': ['nokia'],
        'sony': ['sony', 'xperia'],
        'asus': ['asus', 'zenfone', 'rog phone'],
        'honor': ['honor', 'magic', 'view'],
        'dell': ['dell', 'xps', 'inspiron', 'latitude', 'alienware'],
        'hp': ['hp', 'pavilion', 'spectre', 'envy', 'omen'],
        'lenovo': ['lenovo', 'thinkpad', 'ideapad', 'yoga', 'legion'],
        'acer': ['acer', 'aspire', 'predator', 'swift'],
        'microsoft': ['surface'],
        'razer': ['razer', 'blade'],
        'msi': ['msi', 'titan', 'raider', 'stealth']
    };

    // Helper function to check if device matches company (case-insensitive, checks both company field and device name)
    const deviceMatchesCompany = (device, companyName) => {
        if (!companyName || companyName === 'all') return true;

        const companyLower = companyName.toLowerCase();
        const deviceCompany = (device.company || '').toLowerCase();
        const deviceName = (device.name || '').toLowerCase();

        // First check exact match in company field
        if (deviceCompany === companyLower || deviceCompany.includes(companyLower)) {
            return true;
        }

        // Check if company name appears in device name
        if (deviceName.includes(companyLower)) {
            return true;
        }

        // Check brand-specific keywords
        const keywords = brandKeywords[companyLower] || [];
        for (const keyword of keywords) {
            if (deviceName.includes(keyword) || deviceCompany.includes(keyword)) {
                return true;
            }
        }

        return false;
    };

    // Prepare company slides (Phones)
    const companySlides = allCompanies
        .filter(company => company !== 'all')
        .map(company => {
            const companyDevices = phoneDevices.filter(d => deviceMatchesCompany(d, company));
            return {
                company,
                devices: companyDevices
            };
        });
    // .filter(group => group.devices.length > 0); // Keep all companies to show "Not Available" if empty

    // Prepare laptop slides
    const laptopSlides = allLaptopCompanies
        .filter(company => company !== 'all')
        .map(company => {
            const companyDevices = laptopDevices.filter(d => deviceMatchesCompany(d, company));
            return {
                company,
                devices: companyDevices
            };
        });

    const handleCompanyDotClick = (index) => {
        setCurrentCompanySlide(index);
    };

    const handleCompanyNext = () => {
        setCurrentCompanySlide((prev) => (prev + 1) % companySlides.length);
    };

    const handleCompanyPrev = () => {
        setCurrentCompanySlide((prev) => (prev - 1 + companySlides.length) % companySlides.length);
    };

    const handleLaptopCompanyDotClick = (index) => {
        setCurrentLaptopCompanySlide(index);
    };

    const handleLaptopCompanyNext = () => {
        setCurrentLaptopCompanySlide((prev) => (prev + 1) % laptopSlides.length);
    };

    const handleLaptopCompanyPrev = () => {
        setCurrentLaptopCompanySlide((prev) => (prev - 1 + laptopSlides.length) % laptopSlides.length);
    };

    const slides = [
        {
            title: "Iphone 17 Series",
            content: [
                "Ultra-thin iPhone 17 Air",
                "120Hz ProMotion on all models",
                "A19 / A19 Pro chips",
                "48MP rear + 24MP front cameras",
                "Next-gen Wi-Fi 7 connectivity"
            ],
            image: "https://static.toiimg.com/thumb/msid-114421054,width-1280,height-720,resizemode-4/114421054.jpg",
            alt: "iPhone 17"
        },
        {
            title: "Samsung S25 Edge",
            content: [
                "6.7-inch Dynamic AMOLED 2X display, 1-120Hz adaptive refresh rate",
                "200MP main + 12MP ultra-wide rear cameras, 12MP front camera",
                "Slim 5.8mm titanium frame, ~163g weight",
                "3900mAh battery, 25W wired & wireless charging, Wireless PowerShare",
                "Snapdragon 8 Elite (3nm), 12GB RAM, up to 512GB storage",
                "2600 nits peak brightness",
                "Android 15 with One UI 7 and Galaxy AI features"
            ],
            image: "https://cdn.shopify.com/s/files/1/0470/5393/0645/files/Samsung_Galaxy_S25_Edge_vs_S25_and_S25_Ultra_What_Are_the_Differences.jpg?v=1747290978",
            alt: "Samsung S25 Edge"
        },
        {
            title: "Nothing Phone-3",
            content: [
                "6.67-inch AMOLED display, 1.5K (1260 × 2800), 30-120Hz adaptive refresh rate, HDR10+, 4500-nits peak brightness",
                "Snapdragon 8s Gen 4 chipset, up to 16GB RAM, up to 512GB storage",
                "Triple 50MP rear cameras (main w/ OIS, periscope telephoto 3× optical zoom, ultra-wide) + 50MP front camera",
                "5500mAh battery (India) / ~5150mAh global variant, 65W wired charging, 15W wireless, reverse charging",
            ],
            image: "https://i.gadgets360cdn.com/products/large/Nothing-Phone-3-press-1200x675-1751391432.jpg?downsize=*:360",
            alt: "Nothing Phone-3"
        }
    ];

    // Phone cards data


    return (
        <div className="container">
            {/* Always show NavBar at the top */}
            <NavBar />

            {/* Landing Page Section - First section visible when page loads */}
            <section className="landing-page-container stack-card stack-card--landing">
                <LandingPage onExploreClick={scrollToNewReleases} />
            </section>

            {/* New Releases Section - Can be scrolled to or accessed via Explore button */}
            <section id="new-releases-section" className="new-releases-section stack-card stack-card--releases">
                {slides.map((slide, index) => (
                    <div key={index} className={`content-container ${currentSlide === index ? 'active' : ''}`}>
                        <div className="content-title">
                            <h2>{slide.title}</h2>
                        </div>
                        <div className="slide-content-wrapper">
                            <div className="text-content-side">
                                <div className="content">
                                    <ul>
                                        {slide.content.map((item, itemIndex) => (
                                            <li key={itemIndex}>{item}</li>
                                        ))}
                                    </ul>
                                    <button className="view-details-btn">View Details</button>
                                </div>
                            </div>
                            <div className="image-container">
                                <img src={slide.image} alt={slide.alt} />
                            </div>
                        </div>
                    </div>
                ))}
                <div className="slideshow-controls">
                    <div className="dots">
                        {slides.map((_, index) => (
                            <span
                                key={index}
                                className={`dot ${currentSlide === index ? 'active' : ''}`}
                                onClick={() => handleDotClick(index)}
                            ></span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Phone Cards Section - Company Slider */}
            <section className="phone-cards-container">
                <div className="section-header">
                    <h2 className="section-title">Browse Smartphones</h2>
                </div>

                {loadingDevices ? (
                    <div className="products-loading">Loading products…</div>
                ) : companySlides.length > 0 ? (
                    <div className="company-slider-container">
                        {companySlides.map((slide, index) => (
                            <div
                                key={slide.company}
                                className={`company-slide ${currentCompanySlide === index ? 'active' : ''}`}
                            >
                                <div className="company-title-wrapper">
                                    <h3 className="company-slide-title">{slide.company}</h3>
                                    <div className="slide-navigation">
                                        <button className="nav-btn prev" onClick={handleCompanyPrev}>❮</button>
                                        <button className="nav-btn next" onClick={handleCompanyNext}>❯</button>
                                    </div>
                                </div>

                                {slide.devices.length > 0 ? (
                                    <div className="phone-cards-grid">
                                        {slide.devices.slice(0, 8).map((d, deviceIndex) => (
                                            <CardComponent
                                                key={d._id || deviceIndex}
                                                _id={d._id}
                                                name={d.name}
                                                company={d.company}
                                                price={Number(d.expected_price)}
                                                description={d.description}
                                                ram={d.ram}
                                                storage={d.storage}
                                                image={d.image_url || d.image}
                                                stock={d.stock}
                                                inStock={d.inStock}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-products-panel">
                                        <div className="no-products-content">
                                            <h3>Coming Soon</h3>
                                            <p>We are currently stocking up on {slide.company} products.</p>
                                            <p>Stay tuned for the latest releases!</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="company-slider-dots">
                            {companySlides.map((_, index) => (
                                <span
                                    key={index}
                                    className={`company-dot ${currentCompanySlide === index ? 'active' : ''}`}
                                    onClick={() => handleCompanyDotClick(index)}
                                    title={companySlides[index].company}
                                ></span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="products-loading">No products found.</div>
                )}
            </section>

            {/* Laptop Cards Section - Company Slider */}
            <section className="laptop-cards-container">
                <div className="section-header">
                    <h2 className="section-title">Browse Laptops</h2>
                </div>

                {loadingDevices ? (
                    <div className="products-loading">Loading laptops…</div>
                ) : laptopSlides.length > 0 ? (
                    <div className="company-slider-container">
                        {laptopSlides.map((slide, index) => (
                            <div
                                key={slide.company}
                                className={`company-slide ${currentLaptopCompanySlide === index ? 'active' : ''}`}
                            >
                                <div className="company-title-wrapper">
                                    <h3 className="company-slide-title">{slide.company}</h3>
                                    <div className="slide-navigation">
                                        <button className="nav-btn prev" onClick={handleLaptopCompanyPrev}>❮</button>
                                        <button className="nav-btn next" onClick={handleLaptopCompanyNext}>❯</button>
                                    </div>
                                </div>

                                {slide.devices.length > 0 ? (
                                    <div className="laptop-cards-grid">
                                        {slide.devices.slice(0, 8).map((d, deviceIndex) => (
                                            <CardComponent
                                                key={d._id || deviceIndex}
                                                _id={d._id}
                                                name={d.name}
                                                company={d.company}
                                                price={Number(d.expected_price)}
                                                description={d.description}
                                                ram={d.ram}
                                                storage={d.storage}
                                                image={d.image_url || d.image}
                                                stock={d.stock}
                                                inStock={d.inStock}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-products-panel">
                                        <div className="no-products-content">
                                            <h3>Coming Soon</h3>
                                            <p>We are currently stocking up on {slide.company} laptops.</p>
                                            <p>Stay tuned for the latest releases!</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="company-slider-dots">
                            {laptopSlides.map((_, index) => (
                                <span
                                    key={index}
                                    className={`company-dot ${currentLaptopCompanySlide === index ? 'active' : ''}`}
                                    onClick={() => handleLaptopCompanyDotClick(index)}
                                    title={laptopSlides[index].company}
                                ></span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="products-loading">No laptops found.</div>
                )}
            </section>

            <section className="main-footer-section">
                <Footer />
            </section>

        </div>
    )
}

export default MainPage;
