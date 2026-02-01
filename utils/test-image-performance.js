/**
 * Image Performance Tester
 * 
 * Tests JPEG vs WebP loading performance
 * Run in browser console on your portfolio page
 */

(function() {
    'use strict';
    
    window.testImagePerformance = function(imageBasePath, iterations = 5) {
        const jpegPath = imageBasePath.replace(/\.(jpg|jpeg|png|webp)$/i, '') + '.jpg';
        const webpPath = imageBasePath.replace(/\.(jpg|jpeg|png|webp)$/i, '') + '.webp';
        
        const results = {
            jpeg: [],
            webp: []
        };
        
        function testFormat(path, format) {
            return new Promise((resolve) => {
                const img = new Image();
                const startTime = performance.now();
                
                img.onload = () => {
                    const loadTime = performance.now() - startTime;
                    resolve({
                        format: format,
                        loadTime: loadTime,
                        size: img.naturalWidth + 'x' + img.naturalHeight
                    });
                };
                
                img.onerror = () => {
                    resolve({
                        format: format,
                        loadTime: null,
                        error: true
                    });
                };
                
                img.src = path + '?t=' + Date.now(); // Cache bust
            });
        }
        
        async function runTests() {
            console.log('🧪 Testing image performance...');
            console.log(`   JPEG: ${jpegPath}`);
            console.log(`   WebP: ${webpPath}`);
            console.log(`   Iterations: ${iterations}\n`);
            
            // Test JPEG
            for (let i = 0; i < iterations; i++) {
                const result = await testFormat(jpegPath, 'jpeg');
                if (!result.error) {
                    results.jpeg.push(result.loadTime);
                }
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
            }
            
            // Test WebP
            for (let i = 0; i < iterations; i++) {
                const result = await testFormat(webpPath, 'webp');
                if (!result.error) {
                    results.webp.push(result.loadTime);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Calculate averages
            const jpegAvg = results.jpeg.length > 0 
                ? results.jpeg.reduce((a, b) => a + b, 0) / results.jpeg.length 
                : null;
            const webpAvg = results.webp.length > 0 
                ? results.webp.reduce((a, b) => a + b, 0) / results.webp.length 
                : null;
            
            console.log('\n📊 Results:');
            console.log(`   JPEG: ${jpegAvg ? jpegAvg.toFixed(2) + 'ms avg' : 'Failed to load'}`);
            console.log(`   WebP: ${webpAvg ? webpAvg.toFixed(2) + 'ms avg' : 'Failed to load'}`);
            
            if (jpegAvg && webpAvg) {
                const diff = ((jpegAvg - webpAvg) / webpAvg * 100).toFixed(1);
                const faster = jpegAvg < webpAvg ? 'JPEG' : 'WebP';
                console.log(`\n✅ ${faster} is ${Math.abs(diff)}% faster`);
            }
            
            return { jpeg: jpegAvg, webp: webpAvg };
        }
        
        return runTests();
    };
    
    console.log('✅ Image performance tester loaded!');
    console.log('Usage: testImagePerformance("assets/images/series/artwork-name", 5)');
})();
