"use client";

import Link from "next/link";
import { Hammer, Smartphone, Globe, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");

  return (
    <main className="min-h-screen gradient-bg">
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">AppForger</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm"
              data-testid="link-your-apps"
            >
              Your apps
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              How it works
            </Link>
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Features
            </Link>
            <Link
              href="/signin"
              className="text-muted-foreground hover:text-foreground px-4 py-2"
              data-testid="link-signin"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 font-medium"
              data-testid="link-signup"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          APPFORGER IS LIVE
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
          Forge the apps of the future
          <br />
          <span className="bg-gradient-to-r from-primary to-teal-300 bg-clip-text text-transparent">
            with AppForger today.
          </span>
        </h1>
        
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
          Type what you want to build — AppForger generates a spec, saves it, and instantly creates a shareable live preview link.
        </p>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-card border border-border rounded-xl p-4 glow-cyan">
            <div className="text-left mb-3">
              <span className="text-xs text-muted-foreground">Try a prompt</span>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4 mb-4 text-left text-muted-foreground text-sm">
              Build me a simple CRM with contacts, a pipeline, and notes.
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">+</span>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='Start typing... "Help me build an app that..."'
                  className="w-full pl-10 pr-4 py-3 bg-secondary/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary prompt-input"
                  data-testid="input-prompt"
                />
              </div>
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground p-3 rounded-lg hover:opacity-90"
                data-testid="button-start-building"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Sign in is required to use the Builder (paywall).
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="container mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Choose Your App Type</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Build mobile apps with Expo React Native or web apps with Next.js
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            href="/builder/mobile"
            className="bg-card border border-border rounded-2xl p-8 card-hover group"
            data-testid="link-mobile-builder"
          >
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Smartphone className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Mobile App</h3>
            <p className="text-muted-foreground mb-4">
              Build native iOS and Android apps with Expo React Native. Includes authentication, navigation, and CRUD.
            </p>
            <div className="flex items-center gap-2 text-primary font-medium">
              Start Building <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/builder/web"
            className="bg-card border border-border rounded-2xl p-8 card-hover group"
            data-testid="link-web-builder"
          >
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Globe className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Web App</h3>
            <p className="text-muted-foreground mb-4">
              Build modern web apps with Next.js. Auto-deploys to Vercel with live preview links.
            </p>
            <div className="flex items-center gap-2 text-primary font-medium">
              Start Building <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">What You Get</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Every forged project includes production-ready features
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6 card-hover">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">TypeScript Throughout</h3>
            <p className="text-sm text-muted-foreground">
              Full type safety for reliable, maintainable code.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 card-hover">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Supabase Auth</h3>
            <p className="text-sm text-muted-foreground">
              Email/password authentication built-in.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 card-hover">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Hammer className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">GitHub Integration</h3>
            <p className="text-sm text-muted-foreground">
              Code auto-pushed to your repository.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Hammer className="w-5 h-5 text-primary" />
            <span className="font-semibold">AppForger</span>
          </div>
          <p className="text-sm">Generate mobile and web apps with one click.</p>
        </div>
      </footer>
    </main>
  );
}
