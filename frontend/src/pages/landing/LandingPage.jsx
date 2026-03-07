import { Link } from 'react-router-dom';
import { Building2, Users, HardHat, BarChart3, ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const personas = [
  {
    id: 'resident',
    title: 'Resident',
    description: 'Report neighborhood issues and receive AI-powered guidance on civic matters.',
    icon: Users,
    path: '/resident',
    buttonText: 'Enter Resident Portal',
    features: ['AI Civic Assistant', 'Track Your Reports', 'Community Updates']
  },
  {
    id: 'worker',
    title: 'Public Worker',
    description: 'Manage civic incidents, triage operations, and coordinate field responses.',
    icon: HardHat,
    path: '/worker',
    buttonText: 'Open Worker Console',
    features: ['Incident Queue', 'Hotspot Map', 'Assignment Tracker']
  },
  {
    id: 'admin',
    title: 'City Operator',
    description: 'Monitor civic trends, analyze patterns, and launch strategic interventions.',
    icon: BarChart3,
    path: '/admin',
    buttonText: 'Open City Dashboard',
    features: ['Analytics Dashboard', 'Trend Analysis', 'Escalation Manager']
  }
];

const features = [
  { icon: Shield, title: 'AI-Powered Triage', description: 'Smart prioritization of civic issues' },
  { icon: Zap, title: 'Real-time Updates', description: 'Live incident tracking and status' },
  { icon: Globe, title: 'Open Data', description: 'Integrated with Montgomery datasets' }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <header className="relative bg-civic-blue overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-white/90 text-2xl font-bold tracking-tight font-heading">CivicNest</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-3xl leading-tight font-heading" data-testid="hero-title">
            AI-Powered Civic Intelligence for Montgomery
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
            Transforming how residents, workers, and city operators collaborate to build a safer, cleaner community through intelligent civic engagement.
          </p>
          
          <div className="mt-10 flex flex-wrap gap-4">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-2 rounded-full"
              >
                <feature.icon className="w-4 h-4 text-civic-green" strokeWidth={1.5} />
                <span className="text-white/90 text-sm font-medium">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Persona Selection */}
      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading">Choose Your Portal</h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Select your role to access a tailored experience designed for your civic responsibilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {personas.map((persona) => (
            <Card 
              key={persona.id}
              className="group bg-white border-slate-200 hover:border-civic-blue/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
              data-testid={`persona-card-${persona.id}`}
            >
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl bg-civic-blue/10 flex items-center justify-center mb-4 group-hover:bg-civic-blue group-hover:scale-105 transition-all duration-300">
                  <persona.icon className="w-7 h-7 text-civic-blue group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900 font-heading">
                  {persona.title}
                </CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  {persona.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-4">
                <ul className="space-y-2">
                  {persona.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-civic-green" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Link to={persona.path} className="w-full">
                  <Button 
                    className="w-full bg-civic-blue hover:bg-civic-blue-hover text-white gap-2 group/btn"
                    data-testid={`${persona.id}-portal-btn`}
                  >
                    {persona.buttonText}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" strokeWidth={1.5} />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-civic-blue" strokeWidth={1.5} />
            <span className="text-sm font-medium text-slate-600">CivicNest</span>
          </div>
          <p className="text-sm text-slate-500">
            Powered by Montgomery Open Data Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
