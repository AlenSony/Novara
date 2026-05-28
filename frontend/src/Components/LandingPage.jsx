import '../Stylings/LandingPage.css';

function LandingPage({ onExploreClick }) {
  return (
    <div className="landing-hero-card">
      <div className="landing-content-wrapper">
        <div className="cta-container">
          <div className="card">
            <div className="loader">
              <p>A complete space for</p>
              <div className="words">
                <span className="word">your gadgets</span>
                <span className="word">smart living</span>
                <span className="word">digital life</span>
                <span className="word">innovation</span>
                <span className="word">next-gen tech</span>
              </div>
            </div>
          </div>

          <button className="cta" onClick={onExploreClick}>
            <span className="hover-underline-animation"> Shop now </span>
            <svg
              id="arrow-horizontal"
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="10"
              viewBox="0 0 46 16"
            >
              <path
                id="Path_10"
                data-name="Path 10"
                d="M8,0,6.545,1.455l5.506,5.506H-30V9.039H12.052L6.545,14.545,8,16l8-8Z"
                transform="translate(30)"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;