const fs = require('fs');
const filepath = 'src/Components/LandingPage.jsx';
let f = fs.readFileSync(filepath, 'utf8');

f = f.replace(/className=\"custom-className\"/g, 'className=\"custom-class\"'); // to fix GlitchText class->className mistake, wait glitchtext is probably custom-class, let's just make sure we only replace class= that aren't already className

// better way: replace class= with className= where class is not part of className
f = f.replace(/\sclass=/g, ' className=');
// but now GlitchText has className='custom-class', which ends up being classNameName= if we aren't careful? No, \sclass= avoids className=.

f = f.replace(/stroke-width=/g, 'strokeWidth=');
f = f.replace(/stop-color=/g, 'stopColor=');
f = f.replace(/stop-opacity=/g, 'stopOpacity=');
f = f.replace(/color-interpolation-filters=/g, 'colorInterpolationFilters=');
f = f.replace(/style=\"stop-color:(#[0-9a-fA-F]+);\s*stop-opacity:([0-9.]+)\"/g, 'style={{ stopColor: \'$1\', stopOpacity: $2 }}');

fs.writeFileSync(filepath, f);
