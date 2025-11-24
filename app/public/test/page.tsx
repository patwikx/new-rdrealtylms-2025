'use client'

import React, { useState } from 'react';
import { ShoppingBag, Search, User, Heart, Menu, ArrowRight, Star, Moon, Sun, Wrench, HardHat, Hammer, Fish, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EcommerceHomepage() {
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const categories = [
    { name: 'Construction & Industrial', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=600&fit=crop', tag: 'Professional Grade', icon: HardHat },
    { name: 'DIY & Tools', image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&h=600&fit=crop', tag: 'Home Projects', icon: Hammer },
    { name: 'Fishing Supplies', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop', tag: 'Outdoor Gear', icon: Fish },
    { name: 'Office Supplies', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', tag: 'Business Essentials', icon: Briefcase }
  ];

  const products = [
    { id: 1, name: 'Heavy Duty Power Drill', price: 189, image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&h=600&fit=crop', rating: 4.8, category: 'Tools' },
    { id: 2, name: 'Safety Helmet Pro', price: 45, image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&h=600&fit=crop', rating: 4.9, category: 'Safety' },
    { id: 3, name: 'Industrial Toolbox Set', price: 299, image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&h=600&fit=crop', rating: 4.7, category: 'Storage' },
    { id: 4, name: 'Fishing Rod Carbon Elite', price: 159, image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=500&h=600&fit=crop', rating: 4.6, category: 'Fishing' },
    { id: 5, name: 'Office Chair Ergonomic', price: 249, image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500&h=600&fit=crop', rating: 4.8, category: 'Office' },
    { id: 6, name: 'LED Work Light 5000LM', price: 79, image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&h=600&fit=crop', rating: 4.5, category: 'Lighting' }
  ];

  const features = [
    { icon: HardHat, title: 'Professional Quality', desc: 'Industrial-grade products built to last' },
    { icon: Wrench, title: 'Expert Support', desc: '24/7 technical assistance available' },
    { icon: ArrowRight, title: 'Fast Shipping', desc: 'Same-day dispatch on orders before 2pm' }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Wrench className="w-7 h-7" />
                <h1 className="text-2xl font-bold tracking-tight">ProSupply</h1>
              </div>
              <div className="hidden md:flex items-center gap-6 text-sm">
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Construction</a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">DIY Tools</a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Fishing</a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Office</a>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">3</span>
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800">
          <img 
            src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&h=1080&fit=crop" 
            alt="Hero"
            className="w-full h-full object-cover opacity-50 dark:opacity-30"
          />
        </div>
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <div className="max-w-4xl">
            <div className="mb-6 inline-block px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-bold">
              NEW SEASON STOCK ARRIVED
            </div>
            <h2 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
              Built for
              <br />
              The Job
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Premium construction, industrial, DIY, fishing and office supplies for professionals and enthusiasts
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-sm">
              Shop Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="py-12 px-6 bg-slate-800 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 text-white">
                <div className="bg-white/20 p-3 rounded-sm">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{feature.title}</h4>
                  <p className="text-white/90 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h3 className="text-4xl font-bold mb-2">Shop by Category</h3>
            <p className="text-muted-foreground">Everything you need for work and leisure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div 
                key={index}
                className="group relative h-80 overflow-hidden cursor-pointer"
              >
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full mb-4 group-hover:bg-primary/80 transition-colors duration-300">
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="inline-block px-3 py-1 bg-primary/80 backdrop-blur-sm rounded-sm text-white text-xs font-bold mb-3">
                    {category.tag}
                  </span>
                  <h4 className="text-2xl font-bold text-white mb-2">{category.name}</h4>
                  <div className="flex items-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm font-semibold">View Products</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h3 className="text-4xl font-bold mb-4">Best Sellers</h3>
            <p className="text-muted-foreground text-lg">Top-rated products trusted by professionals</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div 
                key={product.id}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="relative overflow-hidden mb-4 bg-card border border-border">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-sm">
                      {product.category}
                    </span>
                  </div>
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'}`}>
                    <Button size="icon" variant="secondary" className="rounded-sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="icon" className="rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground">
                      <ShoppingBag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-foreground text-foreground" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-xs text-muted-foreground ml-1">(124 reviews)</span>
                  </div>
                  <h4 className="font-semibold text-lg">{product.name}</h4>
                  <p className="text-2xl font-bold">${product.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="rounded-sm">
              View All Products
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="relative h-96 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&h=600&fit=crop" 
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 dark:from-black/80 dark:to-black/60" />
        </div>
        <div className="relative h-full flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-2xl">
              <h3 className="text-5xl font-bold text-white mb-4">
                Trade Account Benefits
              </h3>
              <p className="text-white/90 mb-6 text-lg">
                Join our trade program and get exclusive discounts, priority support, and bulk pricing on all products
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm">
                Apply for Trade Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-6 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Stay Updated</h3>
          <p className="text-muted-foreground mb-8 text-lg">
            Get the latest deals, new product arrivals, and industry tips delivered to your inbox
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="h-12 rounded-sm"
            />
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-sm">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-6 h-6" />
                <h4 className="text-2xl font-bold">ProSupply</h4>
              </div>
              <p className="text-white/70">Your trusted partner for construction, industrial, DIY, fishing and office supplies.</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Shop</h5>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Construction</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Industrial</a></li>
                <li><a href="#" className="hover:text-white transition-colors">DIY Tools</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fishing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Office</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trade Accounts</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reviews</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/70 text-sm">
            <p>© 2024 ProSupply. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}