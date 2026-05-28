import 'font-awesome/css/font-awesome.min.css';
import '../Stylings/Footer.css';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-content">
                <div className="footer-section brand-section">
                    <h2 className="footer-logo">Novara E-Commerce</h2>
                    <p className="footer-description">
                        Space for tech enthusiasts to buy their dream items.

                    </p>
                    <div className="social-icons">
                        <a href="#" className="social-icon"><i className="fa fa-facebook"></i></a>
                        <a href="#" className="social-icon"><i className="fa fa-twitter"></i></a>
                        <a href="#" className="social-icon"><i className="fa fa-instagram"></i></a>
                        <a href="#" className="social-icon"><i className="fa fa-linkedin"></i></a>
                    </div>
                </div>

                <div className="footer-section links-section">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="/main">Home</a></li>
                        <li><a href="/search">Products</a></li>
                        <li><a href="#">About Us</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </div>

                <div className="footer-section contact-section">
                    <h3>Contact Us</h3>
                    <div className="contact-item">
                        <i className="fa fa-map-marker"></i>
                        <span>Kottayam, Kerala, 689588</span>
                    </div>
                    <div className="contact-item">
                        <i className="fa fa-phone"></i>
                        <span>+919456724365</span>
                    </div>
                    <div className="contact-item">
                        <i className="fa fa-envelope"></i>
                        <span>support@novaraecommerce.com</span>    
                    </div>
                </div>

                <div className="footer-section newsletter-section">
                    <h3>Newsletter</h3>
                    <p>Subscribe for latest updates and offers.</p>
                    <div className="newsletter-form">
                        <input type="email" placeholder="Enter your email" />
                        <button type="button"><i className="fa fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Novara E-Commerce. All rights reserved.</p>
                <div className="footer-bottom-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
