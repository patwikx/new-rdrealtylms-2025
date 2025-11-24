'use client'

import React, { useState } from 'react';
import { ShoppingBag, Search, User, ChevronDown, Menu, Building2, Package, TrendingUp, Shield, Truck, Award, Clock, Phone, Mail, Moon, Sun, CheckCircle2, BarChart3, Filter, Grid3x3, List, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function EnterpriseEcommerce() {
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [theme, setTheme] = useState('light');
  const [viewMode, setViewMode] = useState('grid');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const quickActions = [
    { icon: Package, label: 'Bulk Orders', desc: 'Volume discounts available' },
    { icon: Download, label: 'Download Catalog', desc: 'PDF & Excel formats' },
    { icon: BarChart3, label: 'Account Dashboard', desc: 'View order history' },
    { icon: Clock, label: 'Quick Reorder', desc: 'From past orders' }
  ];

  const categories = [
    { name: 'Power Tools', count: 2847, trend: '+12%' },
    { name: 'Hand Tools', count: 4231, trend: '+8%' },
    { name: 'Safety Equipment', count: 1593, trend: '+15%' },
    { name: 'Measuring Tools', count: 892, trend: '+5%' },
    { name: 'Fasteners', count: 6741, trend: '+10%' },
    { name: 'Electrical', count: 3214, trend: '+7%' },
    { name: 'Plumbing', count: 2156, trend: '+9%' },
    { name: 'Paint Supplies', count: 1847, trend: '+6%' }
  ];

  const products = [
    { 
      id: 1, 
      name: 'Professional Cordless Drill Kit 20V MAX', 
      sku: 'CDK-20V-MAX-001',
      price: 189.99, 
      bulkPrice: 169.99,
      image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&h=600&fit=crop',
      stock: 487,
      moq: 10,
      lead: 'Same Day',
      rating: 4.8,
      reviews: 342
    },
    { 
      id: 2, 
      name: 'Industrial Safety Helmet ANSI Certified', 
      sku: 'ISH-ANSI-Z89',
      price: 45.99, 
      bulkPrice: 39.99,
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&h=600&fit=crop',
      stock: 1247,
      moq: 50,
      lead: 'Same Day',
      rating: 4.9,
      reviews: 856
    },
    { 
      id: 3, 
      name: 'Heavy Duty Rolling Tool Cabinet 54"', 
      sku: 'HDTC-54-PRO',
      price: 1299.99, 
      bulkPrice: 1149.99,
      image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&h=600&fit=crop',
      stock: 89,
      moq: 5,
      lead: '2-3 Days',
      rating: 4.7,
      reviews: 234
    },
    { 
      id: 4, 
      name: 'Commercial LED Work Light 5000 Lumens', 
      sku: 'LED-5K-COM',
      price: 79.99, 
      bulkPrice: 69.99,
      image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&h=600&fit=crop',
      stock: 623,
      moq: 20,
      lead: 'Same Day',
      rating: 4.6,
      reviews: 445
    },
    { 
      id: 5, 
      name: 'Ergonomic Office Chair Executive Series', 
      sku: 'EOC-EXE-BLK',
      price: 349.99, 
      bulkPrice: 299.99,
      image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500&h=600&fit=crop',
      stock: 156,
      moq: 10,
      lead: '1-2 Days',
      rating: 4.8,
      reviews: 567
    },
    { 
      id: 6, 
      name: 'Digital Laser Distance Measure 330ft', 
      sku: 'DLD-330-PRO',
      price: 129.99, 
      bulkPrice: 114.99,
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=600&fit=crop',
      stock: 341,
      moq: 15,
      lead: 'Same Day',
      rating: 4.7,
      reviews: 289
    },
    { 
      id: 7, 
      name: 'Fishing Rod Carbon Fiber Elite Pro', 
      sku: 'FRC-ELITE-PRO',
      price: 189.99, 
      bulkPrice: 169.99,
      image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=500&h=600&fit=crop',
      stock: 234,
      moq: 12,
      lead: '2-3 Days',
      rating: 4.9,
      reviews: 412
    },
    { 
      id: 8, 
      name: 'Industrial Wire Shelving Unit 48x24x72', 
      sku: 'IWS-482472-CHR',
      price: 249.99, 
      bulkPrice: 219.99,
      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&h=600&fit=crop',
      stock: 178,
      moq: 8,
      lead: '1-2 Days',
      rating: 4.6,
      reviews: 298
    }
  ];

  const featuredBrands = [
    'DeWalt', 'Bosch', 'Milwaukee', '3M', 'Honeywell', 'Stanley'
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <div className="bg-muted border-b border-border py-2 px-6">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-medium">1-800-SUPPLY-PRO</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Mon-Fri 7AM-8PM EST</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-primary transition-colors font-medium">Track Order</a>
            <a href="#" className="hover:text-primary transition-colors font-medium">Quote Request</a>
            <a href="#" className="hover:text-primary transition-colors font-medium">Help Center</a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 w-full bg-background/98 backdrop-blur-md z-50 border-b border-border shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-sm">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="leading-none">
                  <h1 className="text-lg font-bold">ProSupply</h1>
                  <p className="text-[10px] text-muted-foreground font-medium">Enterprise</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-2 bg-muted px-4 py-2.5 rounded-sm border border-border focus-within:border-primary transition-colors">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search 50,000+ products by name, SKU, or category..." 
                  className="bg-transparent border-none outline-none text-sm flex-1"
                />
                <Button size="sm" className="h-7">Search</Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" className="hidden lg:flex gap-2">
                <User className="w-4 h-4" />
                Account
              </Button>
              <Button variant="default" size="sm" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                <Badge className="bg-background text-foreground hover:bg-background ml-1">3</Badge>
              </Button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="border-t border-border bg-muted/30">
          <div className="max-w-[1600px] mx-auto px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="gap-1 h-8">
                  All Categories <ChevronDown className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8">Construction</Button>
                <Button variant="ghost" size="sm" className="h-8">Industrial</Button>
                <Button variant="ghost" size="sm" className="h-8">Tools</Button>
                <Button variant="ghost" size="sm" className="h-8">Safety</Button>
                <Button variant="ghost" size="sm" className="h-8">Office</Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Free shipping on orders $500+</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Quick Actions Bar */}
      <section className="border-b border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex items-center gap-3 p-4 rounded-sm border border-border hover:border-primary hover:bg-muted/50 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Strip */}
      <section className="border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Browse Categories</h3>
            <Button variant="ghost" size="sm">View All →</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat, index) => (
              <button
                key={index}
                className="p-3 rounded-sm border border-border hover:border-primary hover:bg-muted/50 transition-all text-left group"
              >
                <p className="font-semibold text-sm mb-1">{cat.name}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{cat.count} items</p>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">{cat.trend}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="border-b border-border bg-muted/30">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold text-muted-foreground">Featured Brands:</span>
            <div className="flex items-center gap-6 flex-wrap">
              {featuredBrands.map((brand, index) => (
                <button key={index} className="text-sm font-medium hover:text-primary transition-colors">
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-1">All Products</h3>
              <p className="text-sm text-muted-foreground">Showing 8 of 50,247 products</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <div className="flex items-center gap-1 border border-border rounded-sm">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <select className="border border-border rounded-sm px-3 py-1.5 text-sm bg-background">
                <option>Sort: Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div 
                key={product.id}
                className="group cursor-pointer bg-card border border-border hover:shadow-md transition-all rounded-sm"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500 text-white text-[10px] px-2">
                      {product.lead}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono mb-1">SKU: {product.sku}</p>
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                      {product.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500">★</span>
                      <span className="font-medium">{product.rating}</span>
                    </div>
                    <span className="text-muted-foreground">({product.reviews})</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">{product.stock} in stock</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold">${product.price}</span>
                      <span className="text-[10px] text-muted-foreground">each</span>
                    </div>
                    <div className="bg-muted px-2 py-1 rounded-sm">
                      <p className="text-[10px] font-semibold text-primary">
                        ${product.bulkPrice} for {product.moq}+ units
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1 h-8 text-xs">Add to Cart</Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs">Quote</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Button variant="outline" size="lg">Load More Products</Button>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 px-6 border-y border-border bg-muted/30">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold text-sm">Secure Ordering</p>
                <p className="text-xs text-muted-foreground">SSL Encrypted</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold text-sm">Fast Delivery</p>
                <p className="text-xs text-muted-foreground">Same Day Available</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold text-sm">Certified Products</p>
                <p className="text-xs text-muted-foreground">Quality Guaranteed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold text-sm">24/7 Support</p>
                <p className="text-xs text-muted-foreground">Always Here to Help</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-sm">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="leading-none">
                  <h4 className="text-base font-bold">ProSupply</h4>
                  <p className="text-[10px] text-muted-foreground">Enterprise Solutions</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Trusted supplier of construction, industrial, DIY, fishing and office supplies for businesses worldwide.
              </p>
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-medium">1-800-SUPPLY-PRO</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  enterprise@prosupply.com
                </p>
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-sm mb-3">Categories</h5>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Construction</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Industrial</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">DIY Tools</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Fishing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Office</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-sm mb-3">Enterprise</h5>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Volume Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Access</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Account Management</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Custom Solutions</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-sm mb-3">Support</h5>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
            <p>© 2024 ProSupply Enterprise. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Compliance</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}