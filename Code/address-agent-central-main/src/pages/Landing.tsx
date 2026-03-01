import { ArrowRight, Shield, MapPin, Globe, Lock, CheckCircle2, Users, Building2, User, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">DAP Connect</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="ghost">Admin Portal</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8 animate-fade-in">
            <Shield className="h-4 w-4" />
            Digital Public Infrastructure of India
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in animation-delay-100">
            Your Location,
            <br />
            <span className="text-gradient">Your Identity.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in animation-delay-200">
            One verified digital address for all services. 
            <br className="hidden md:block" />
            Private. Precise. Portable.
          </p>

          {/* Dual Login Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animation-delay-300">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 h-14 w-full sm:w-auto">
                <User className="h-5 w-5 mr-2" />
                Citizen Login (AIA)
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14 w-full sm:w-auto border-accent text-accent hover:bg-accent/10">
                <Server className="h-5 w-5 mr-2" />
                Provider Admin Login (AIP)
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-muted-foreground animate-fade-in animation-delay-400">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              <span className="text-sm">Dept. of Posts, India</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm">UIDAI Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              <span className="text-sm">ISRO Grid Standard</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: 'Privacy by Design',
                description: 'No app tracks you without consent. Your address data is protected by cryptographic signatures and time-bound tokens.',
                color: 'from-accent to-accent/60'
              },
              {
                icon: MapPin,
                title: 'Geospatial Precision',
                description: '4m × 4m accuracy using the National DIGIPIN Grid. Every inch of India has a unique, machine-readable identity.',
                color: 'from-success to-success/60'
              },
              {
                icon: Globe,
                title: 'Federated Architecture',
                description: 'Your data stays with your chosen provider. No central database. No single point of failure.',
                color: 'from-status-gold to-status-orange'
              }
            ].map((prop, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${prop.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <prop.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{prop.title}</h3>
                <p className="text-muted-foreground">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How DAP Connect Works
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            A two-layer addressing system that combines machine precision with human readability
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                DIGIPIN Layer
              </h3>
              <code className="text-2xl font-mono font-bold text-accent block mb-4">3JK-4M5-6LPT</code>
              <p className="text-muted-foreground">
                A unique 10-character geospatial code that maps to a precise 4m × 4m grid anywhere in India. Machine-readable and unambiguous.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm">2</span>
                Digital Address Layer
              </h3>
              <code className="text-2xl font-mono font-bold text-primary block mb-4">yourname@home</code>
              <p className="text-muted-foreground">
                A human-friendly label that acts as a proxy for your DIGIPIN. Easy to remember, share, and use across all services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Take Control of Your Address Identity
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MapPin, title: 'Create Addresses', desc: 'Generate DIGIPINs for any location' },
              { icon: Shield, title: 'Manage Access', desc: 'Control who sees your location' },
              { icon: Users, title: 'One-Time Tokens', desc: 'Share addresses temporarily' },
              { icon: CheckCircle2, title: 'Get Verified', desc: 'Physical verification by AAVA' }
            ].map((feature, index) => (
              <div key={index} className="p-6 rounded-xl bg-card border border-border text-center hover:border-accent/30 transition-all">
                <feature.icon className="h-8 w-8 text-accent mx-auto mb-4" />
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-primary to-primary/80">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Your Digital Address?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
              Join millions of Indians who are securing their location identity with DAP Connect.
            </p>
            <Link to="/user/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8 h-14">
                Get Started Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">DAP Connect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              A Digital Public Infrastructure Initiative by the Department of Posts, Government of India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
