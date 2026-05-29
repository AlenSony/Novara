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

    // Sticky Stacking Cards Animation Logic
    useEffect(() => {
        const container = document.querySelector('.container');
        if (!container) return;

        const handleScroll = () => {
            const cards = document.querySelectorAll('.stack-card');
            const viewportHeight = window.innerHeight;
            
            cards.forEach((card, idx) => {
                const nextCard = cards[idx + 1];
                if (nextCard) {
                    const nextRect = nextCard.getBoundingClientRect();
                    // Trigger stack effect when the next card is 15% into the viewport
                    if (nextRect.top < viewportHeight * 0.85) {
                        card.classList.add('is-stacked');
                    } else {
                        card.classList.remove('is-stacked');
                    }
                }
            });
        };
        
        handleScroll();
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
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

    // Lifestyle Personas
    const lifestylePersonas = [
        {
            id: 'fps-grinder',
            title: 'THE FPS GRINDER',
            quote: "Wanna be a monster in gaming but can't find the right device?",
            type: 'cross-device', // Enforces finding the highest-priced flagship and at least 1 phone + 1 laptop
            keywords: [
                'rog', 'iqoo', 'legion', 'alienware', 'msi', 'titan', 'omen', 'predator', 'gt',
                'razer', 'blade', 'strix', 'zephyrus', 'tuf', 'nitro', 'g15', 'g16', 'black shark', 'redmagic'
            ],
        },
        {
            id: 'mobile-creative',
            title: 'THE MOBILE CREATIVE',
            quote: "Looking for a camera so good it feels like cheating.",
            type: 'mobile-only', // Automatically locks out laptops, focusing strictly on high-end camera smartphones
            keywords: [
                'ultra', 'pro max', 'xperia', 'pixel', 'vivid', 'camera', 'lens', 'sensor', 'megapixel', 
                'iphone', 'galaxy', 'optics', 'leica', 'zeiss', 'hassleblad', 'pro', 'zoom', 'photography'
            ],
        },
        {
            id: 'all-day-commuter',
            title: 'THE ALL-DAY COMMUTER',
            quote: "My battery needs to survive an international flight without a single tether.",
            type: 'cross-device', // Evaluates ultra-efficient ultrabooks side-by-side with massive-capacity mobile phones
            keywords: [
                'air', 'nord', 'swift', 'thinkpad', 'zenbook', 'macbook air', 'y series',
                'gram', 'galaxy book', 'surface laptop', 'latitude', 'elitebook', 'plus', 'max battery'
            ],
        },
        {
            id: 'premium-innovators',
            title: 'THE PREMIUM INNOVATORS',
            quote: "Demanding absolute hardware refinement, seamless ecosystems, and trendsetting design.",
            type: 'cross-device', // Perfectly blends Samsung's premium laptop/phone ecosystem with Vivo's apex mobile hardware
            keywords: [
                'samsung', 'galaxy', 'vivo', 'v-series', 'x-series', 'fold', 'flip', 'book ultra', 'x100', 'v40'
            ]
        }
    ];

    const getDevicesForPersona = (persona) => {
        const keywords = persona.keywords || [];
        const isMobileOnly = persona.type === 'mobile-only' || persona.id === 'mobile-creative';

        // 1. Dynamic Category Constraints & Multi-Field Matching
        let matched = devices.filter(d => {
            if (d.stock !== undefined && Number(d.stock) <= 0) return false;

            const cat = (d.category || '').toLowerCase();
            const isSmartphone = cat === 'smartphone' || cat === 'foldable smartphone';

            if (isMobileOnly && !isSmartphone) return false;

            const name = (d.name || '').toLowerCase();
            const company = (d.company || '').toLowerCase();
            const desc = (d.description || '').toLowerCase();

            return keywords.some(k =>
                name.includes(k) ||
                company.includes(k) ||
                desc.includes(k) ||
                cat.includes(k)
            );
        });

        // 2. Safe Fallback Catch: If a mobile-only persona yields 0 matches, back out the strict constraint
        if (isMobileOnly && matched.length === 0) {
            matched = devices.filter(d => {
                if (d.stock !== undefined && Number(d.stock) <= 0) return false;

                const name = (d.name || '').toLowerCase();
                const company = (d.company || '').toLowerCase();
                const desc = (d.description || '').toLowerCase();
                const cat = (d.category || '').toLowerCase();

                return keywords.some(k =>
                    name.includes(k) ||
                    company.includes(k) ||
                    desc.includes(k) ||
                    cat.includes(k)
                );
            });
        }

        // 2. Company Deduplication & Top Flagship Extraction
        const companyMap = {};

        matched.forEach(d => {
            const companyName = (d.company || 'Unknown').trim();
            const price = Number(d.expected_price || d.price || 0);

            if (!companyMap[companyName]) {
                companyMap[companyName] = d;
            } else {
                const currentFlagshipPrice = Number(companyMap[companyName].expected_price || companyMap[companyName].price || 0);
                if (price > currentFlagshipPrice) {
                    companyMap[companyName] = d;
                }
            }
        });

        let topFlagships = Object.values(companyMap).sort((a, b) => {
            const priceA = Number(a.expected_price || a.price || 0);
            const priceB = Number(b.expected_price || b.price || 0);
            return priceB - priceA;
        });

        // 3. Enforce Cross-Category Diversity Requirements
        if (!isMobileOnly && topFlagships.length > 0) {
            const hasPhone = topFlagships.some(d => {
                const c = (d.category || '').toLowerCase();
                return c === 'smartphone' || c === 'foldable smartphone';
            });
            const hasLaptop = topFlagships.some(d => {
                const c = (d.category || '').toLowerCase();
                return c === 'laptop';
            });

            if (!hasPhone || !hasLaptop) {
                const missingCategoryType = !hasPhone ? 'phone' : 'laptop';

                const missingCategoryPool = matched.filter(d => {
                    const c = (d.category || '').toLowerCase();
                    return missingCategoryType === 'phone'
                        ? (c === 'smartphone' || c === 'foldable smartphone')
                        : (c === 'laptop');
                }).sort((a, b) => {
                    const priceA = Number(a.expected_price || a.price || 0);
                    const priceB = Number(b.expected_price || b.price || 0);
                    return priceB - priceA;
                });

                if (missingCategoryPool.length > 0) {
                    const backfillDevice = missingCategoryPool[0];
                    if (topFlagships.length >= 4) {
                        topFlagships.pop(); // Remove lowest-ranking device if we are full
                    } else if (topFlagships.length > 0) {
                        topFlagships.pop(); // Still replace the lowest if array is small, to ensure swap. (Or we could just push if < 4, but user said "replace the lowest-ranking")
                    }
                    topFlagships.push(backfillDevice);

                    topFlagships.sort((a, b) => {
                        const priceA = Number(a.expected_price || a.price || 0);
                        const priceB = Number(b.expected_price || b.price || 0);
                        return priceB - priceA;
                    });
                }
            }
        }

        // 4. Clean Array Return
        return topFlagships.slice(0, 4);
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
            <section className="landing-page-container stack-card stack-card--landing" style={{ zIndex: 1 }}>
                <LandingPage onExploreClick={scrollToNewReleases} />
            </section>

            {/* New Releases Section - Can be scrolled to or accessed via Explore button */}
            <section id="new-releases-section" className="new-releases-section stack-card stack-card--releases" style={{ zIndex: 2 }}>
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

            {/* Lifestyle Personas Section */}
            {lifestylePersonas.map((persona, index) => {
                const matchedDevices = getDevicesForPersona(persona);
                return (
                    <section key={persona.id} className="persona-section stack-card" style={{ zIndex: 3 + index }}>
                        <div className="persona-layout-split">
                            <div className="persona-anchor-side">
                                <h2>{persona.title}</h2>
                                <p>"{persona.quote}"</p>
                            </div>
                            <div className="persona-devices-side">
                                {loadingDevices ? (
                                    <div className="products-loading">Loading devices...</div>
                                ) : matchedDevices.length > 0 ? (
                                    <div className="persona-cards-grid">
                                        {matchedDevices.map((d, deviceIndex) => (
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
                                            <p>We are sourcing the best gear for {persona.title}.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                );
            })}

            <section className="main-footer-section">
                <Footer />
            </section>

        </div>
    )
}

export default MainPage;
