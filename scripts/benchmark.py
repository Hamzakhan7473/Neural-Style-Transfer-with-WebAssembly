#!/usr/bin/env python3
"""
Performance benchmarking suite for the style transfer application
"""

import time
import json
import statistics
import subprocess
import webbrowser
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException

class StyleTransferBenchmark:
    """Automated benchmarking for style transfer performance"""
    
    def __init__(self, url: str = "http://localhost:8000"):
        self.url = url
        self.results = {}
        
        # Setup Chrome with WebGPU enabled
        chrome_options = Options()
        chrome_options.add_argument("--enable-unsafe-webgpu")
        chrome_options.add_argument("--enable-features=WebGPU")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--allow-running-insecure-content")
        chrome_options.add_experimental_option("useAutomationExtension", False)
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 30)
        
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.driver.quit()
        
    def run_full_benchmark_suite(self):
        """Run complete benchmark suite"""
        print("🏁 Starting Style Transfer Benchmark Suite")
        print("=" * 50)
        
        try:
            # Load the application
            self._load_application()
            
            # Wait for initialization
            self._wait_for_initialization()
            
            # Run benchmarks
            self.results['initialization'] = self._benchmark_initialization()
            self.results['model_loading'] = self._benchmark_model_loading()
            self.results['image_processing'] = self._benchmark_image_processing()
            self.results['memory_usage'] = self._benchmark_memory_usage()
            self.results['browser_compatibility'] = self._test_browser_features()
            
            # Generate report
            self._generate_report()
            
        except Exception as e:
            print(f"❌ Benchmark failed: {e}")
            raise
            
    def _load_application(self):
        """Load the web application"""
        print("🌐 Loading application...")
        self.driver.get(self.url)
        
        # Wait for page load
        self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "app-container"))
        )
        
    def _wait_for_initialization(self):
        """Wait for WebAssembly and models to initialize"""
        print("⏳ Waiting for initialization...")
        
        try:
            # Wait for status to show "Ready"
            self.wait.until(
                EC.text_to_be_present_in_element(
                    (By.ID, "statusText"), 
                    "Ready"
                )
            )
            print("✅ Application initialized")
            
        except TimeoutException:
            print("⚠️  Initialization timeout - continuing anyway")
            
    def _benchmark_initialization(self):
        """Benchmark application initialization time"""
        print("📊 Benchmarking initialization...")
        
        # Reload page and measure initialization time
        times = []
        
        for i in range(3):
            start_time = time.time()
            self.driver.refresh()
            
            try:
                self.wait.until(
                    EC.text_to_be_present_in_element(
                        (By.ID, "statusText"), 
                        "Ready"
                    )
                )
                end_time = time.time()
                times.append(end_time - start_time)
                
            except TimeoutException:
                times.append(30.0)  # Timeout value
                
        return {
            'avg_time': statistics.mean(times),
            'min_time': min(times),
            'max_time': max(times),
            'attempts': len(times)
        }
        
    def _benchmark_model_loading(self):
        """Benchmark model loading times"""
        print("📊 Benchmarking model loading...")
        
        model_times = {}
        style_options = self.driver.find_elements(By.CLASS_NAME, "style-option")
        
        for option in style_options[:3]:  # Test first 3 models
            style_name = option.get_attribute("data-style-name")
            
            start_time = time.time()
            option.click()
            
            try:
                # Wait for model to load (loading class to disappear)
                WebDriverWait(self.driver, 30).until_not(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, f'[data-style-name="{style_name}"].loading'))
                )
                end_time = time.time()
                model_times[style_name] = end_time - start_time
                
            except TimeoutException:
                model_times[style_name] = 30.0
                
            time.sleep(2)  # Brief pause between tests
            
        return model_times
        
    def _benchmark_image_processing(self):
        """Benchmark image processing performance"""
        print("📊 Benchmarking image processing...")
        
        # Upload test image
        self._upload_test_image()
        
        # Select a style
        style_option = self.driver.find_element(By.CLASS_NAME, "style-option")
        style_option.click()
        
        # Wait for model to load
        time.sleep(3)
        
        # Benchmark stylization
        processing_times = []
        
        for i in range(3):
            stylize_btn = self.driver.find_element(By.ID, "stylizeBtn")
            
            start_time = time.time()
            stylize_btn.click()
            
            try:
                # Wait for processing to complete
                WebDriverWait(self.driver, 60).until(
                    EC.invisibility_of_element_located((By.ID, "processingOverlay"))
                )
                end_time = time.time()
                processing_times.append(end_time - start_time)
                
            except TimeoutException:
                processing_times.append(60.0)
                
            time.sleep(2)
            
        return {
            'avg_processing_time': statistics.mean(processing_times),
            'min_processing_time': min(processing_times),
            'max_processing_time': max(processing_times)
        }
        
    def _benchmark_memory_usage(self):
        """Benchmark memory usage"""
        print("📊 Benchmarking memory usage...")
        
        # Execute JavaScript to get memory info
        try:
            memory_info = self.driver.execute_script("""
                if (performance.memory) {
                    return {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    };
                }
                return null;
            """)
            
            if memory_info:
                return {
                    'used_heap_mb': memory_info['usedJSHeapSize'] / 1024 / 1024,
                    'total_heap_mb': memory_info['totalJSHeapSize'] / 1024 / 1024,
                    'heap_limit_mb': memory_info['jsHeapSizeLimit'] / 1024 / 1024
                }
            else:
                return {'error': 'Memory API not available'}
                
        except Exception as e:
            return {'error': str(e)}
            
    def _test_browser_features(self):
        """Test browser feature compatibility"""
        print("📊 Testing browser compatibility...")
        
        features = self.driver.execute_script("""
            return {
                webassembly: typeof WebAssembly !== 'undefined',
                webgpu: 'gpu' in navigator,
                serviceworker: 'serviceWorker' in navigator,
                webworkers: typeof Worker !== 'undefined',
                indexeddb: 'indexedDB' in window,
                filereader: typeof FileReader !== 'undefined',
                mediadevices: navigator.mediaDevices && navigator.mediaDevices.getUserMedia
            };
        """)
        
        return features
        
    def _upload_test_image(self):
        """Upload a test image for benchmarking"""
        # Create a simple test image using canvas
        self.driver.execute_script("""
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Create gradient test image
            const gradient = ctx.createLinearGradient(0, 0, 512, 512);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#4ecdc4');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 512);
            
            // Convert to blob and trigger file input
            canvas.toBlob(function(blob) {
                const file = new File([blob], 'test-image.png', {type: 'image/png'});
                const dt = new DataTransfer();
                dt.items.add(file);
                const fileInput = document.getElementById('fileInput');
                fileInput.files = dt.files;
                fileInput.dispatchEvent(new Event('change', {bubbles: true}));
            });
        """)
        
        # Wait for image to be processed
        time.sleep(2)
        
    def _generate_report(self):
        """Generate detailed benchmark report"""
        print("\n📋 Benchmark Results")
        print("=" * 30)
        
        # Print results
        for category, data in self.results.items():
            print(f"\n🔍 {category.replace('_', ' ').title()}:")
            if isinstance(data, dict):
                for key, value in data.items():
                    if isinstance(value, float):
                        print(f"   {key}: {value:.2f}")
                    else:
                        print(f"   {key}: {value}")
            else:
                print(f"   {data}")
                
        # Save to JSON file
        output_file = Path("benchmark_results.json")
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
            
        print(f"\n💾 Results saved to: {output_file}")
        
        # Generate HTML report
        self._generate_html_report()
        
    def _generate_html_report(self):
        """Generate HTML benchmark report"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Style Transfer Benchmark Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .metric {{ margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }}
                .good {{ border-left: 5px solid #4CAF50; }}
                .warning {{ border-left: 5px solid #FF9800; }}
                .error {{ border-left: 5px solid #F44336; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>🎨 Style Transfer Benchmark Report</h1>
            <p>Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}</p>
            
            <h2>Performance Metrics</h2>
            {self._format_metrics_html()}
            
            <h2>Browser Compatibility</h2>
            {self._format_compatibility_html()}
            
            <h2>Recommendations</h2>
            {self._generate_recommendations_html()}
        </body>
        </html>
        """
        
        with open("benchmark_report.html", 'w') as f:
            f.write(html_content)
            
        print("📊 HTML report generated: benchmark_report.html")
        
    def _format_metrics_html(self):
        """Format performance metrics as HTML"""
        html = "<table><tr><th>Metric</th><th>Value</th><th>Status</th></tr>"
        
        if 'initialization' in self.results:
            init_time = self.results['initialization']['avg_time']
            status = "good" if init_time < 5 else "warning" if init_time < 10 else "error"
            html += f"<tr><td>Initialization Time</td><td>{init_time:.2f}s</td><td class='{status}'>{status.title()}</td></tr>"
            
        if 'image_processing' in self.results:
            proc_time = self.results['image_processing']['avg_processing_time']
            status = "good" if proc_time < 5 else "warning" if proc_time < 15 else "error"
            html += f"<tr><td>Processing Time</td><td>{proc_time:.2f}s</td><td class='{status}'>{status.title()}</td></tr>"
            
        if 'memory_usage' in self.results and 'used_heap_mb' in self.results['memory_usage']:
            memory = self.results['memory_usage']['used_heap_mb']
            status = "good" if memory < 100 else "warning" if memory < 200 else "error"
            html += f"<tr><td>Memory Usage</td><td>{memory:.1f} MB</td><td class='{status}'>{status.title()}</td></tr>"
            
        html += "</table>"
        return html
        
    def _format_compatibility_html(self):
        """Format browser compatibility as HTML"""
        if 'browser_compatibility' not in self.results:
            return "<p>No compatibility data available</p>"
            
        features = self.results['browser_compatibility']
        html = "<table><tr><th>Feature</th><th>Supported</th></tr>"
        
        for feature, supported in features.items():
            status = "✅" if supported else "❌"
            html += f"<tr><td>{feature.replace('_', ' ').title()}</td><td>{status}</td></tr>"
            
        html += "</table>"
        return html
        
    def _generate_recommendations_html(self):
        """Generate performance recommendations"""
        recommendations = []
        
        if 'initialization' in self.results:
            if self.results['initialization']['avg_time'] > 10:
                recommendations.append("Consider optimizing WebAssembly module size")
                
        if 'memory_usage' in self.results and 'used_heap_mb' in self.results['memory_usage']:
            if self.results['memory_usage']['used_heap_mb'] > 150:
                recommendations.append("Memory usage is high - consider implementing garbage collection")
                
        if not recommendations:
            recommendations.append("Performance looks good! 🎉")
            
        html = "<ul>"
        for rec in recommendations:
            html += f"<li>{rec}</li>"
        html += "</ul>"
        
        return html

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Run style transfer benchmarks")
    parser.add_argument("--url", default="http://localhost:8000", help="Application URL")
    parser.add_argument("--headless", action="store_true", help="Run in headless mode")
    
    args = parser.parse_args()
    
    print("🏁 Style Transfer Performance Benchmark")
    print("=" * 40)
    
    try:
        with StyleTransferBenchmark(args.url) as benchmark:
            benchmark.run_full_benchmark_suite()
            
    except KeyboardInterrupt:
        print("\n🛑 Benchmark interrupted by user")
    except Exception as e:
        print(f"❌ Benchmark failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
