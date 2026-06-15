import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Home } from '@/pages/Home'
import { Agendar } from '@/pages/Agendar'
import { Painel } from '@/pages/Painel'
import { Produtos } from '@/pages/Produtos'
import { IS_SAO_JOAO } from './config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds for fresh data
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className={`min-h-screen ${IS_SAO_JOAO ? 'theme-sao-joao bg-[#FAF6F0]' : 'bg-white'} text-gray-800 flex flex-col transition-colors duration-500`}>
            <Navbar />
            {IS_SAO_JOAO && (
              <div className="absolute top-16 left-0 right-0 z-20 pointer-events-none overflow-hidden h-28 sm:h-32">
                <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* String line */}
                  <path d="M-10 10 Q 150 70, 300 20 T 600 20 T 900 20 T 1210 10" stroke="#783F04" strokeWidth="2" strokeDasharray="3 3" />
                  
                  {/* Flags group (Bandeirinhas) */}
                  {/* First curve flags */}
                  <polygon points="30,17 60,19 45,60" fill="#EF4444" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="80,21 110,24 95,65" fill="#3B82F6" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="130,26 160,28 145,69" fill="#10B981" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="180,28 210,28 195,69" fill="#F59E0B" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="230,26 260,23 245,65" fill="#EC4899" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="280,21 310,18 295,59" fill="#10B981" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />

                  {/* Second curve flags */}
                  <polygon points="330,17 360,17 345,58" fill="#EF4444" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="380,18 410,19 395,60" fill="#3B82F6" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="430,20 460,21 445,62" fill="#F59E0B" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="480,21 510,21 495,62" fill="#EC4899" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="530,21 560,20 545,61" fill="#3B82F6" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="580,18 610,17 595,58" fill="#10B981" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />

                  {/* Third curve flags */}
                  <polygon points="630,17 660,18 645,59" fill="#EF4444" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="680,20 710,21 695,62" fill="#3B82F6" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="730,21 760,21 745,62" fill="#F59E0B" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="780,21 810,20 795,61" fill="#EC4899" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="830,18 860,17 845,58" fill="#10B981" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="880,17 910,17 895,58" fill="#EF4444" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />

                  {/* Fourth curve flags */}
                  <polygon points="930,18 960,20 945,61" fill="#3B82F6" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="980,21 1010,23 995,64" fill="#F59E0B" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="1030,24 1060,26 1045,67" fill="#10B981" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="1080,24 1110,21 1095,62" fill="#EC4899" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <polygon points="1130,19 1160,17 1145,58" fill="#EF4444" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />

                  {/* Lights */}
                  <path d="M-10 15 Q 150 78, 300 25 T 600 25 T 900 25 T 1210 15" stroke="rgba(253, 224, 71, 0.4)" strokeWidth="1.5" />
                  <circle cx="150" cy="53" r="6" fill="#FDE047" className="animate-bulb-glow filter drop-shadow-[0_0_6px_#FDE047]" />
                  <circle cx="350" cy="38" r="6" fill="#FDE047" className="animate-bulb-glow filter drop-shadow-[0_0_6px_#FDE047]" style={{ animationDelay: '0.3s' }} />
                  <circle cx="500" cy="38" r="6" fill="#FDE047" className="animate-bulb-glow filter drop-shadow-[0_0_6px_#FDE047]" style={{ animationDelay: '0.6s' }} />
                  <circle cx="750" cy="38" r="6" fill="#FDE047" className="animate-bulb-glow filter drop-shadow-[0_0_6px_#FDE047]" style={{ animationDelay: '0.9s' }} />
                  <circle cx="950" cy="40" r="6" fill="#FDE047" className="animate-bulb-glow filter drop-shadow-[0_0_6px_#FDE047]" style={{ animationDelay: '1.2s' }} />
                  <circle cx="1100" cy="34" r="6" fill="#FDE047" className="animate-bulb-glow filter drop-shadow-[0_0_6px_#FDE047]" style={{ animationDelay: '1.5s' }} />
                </svg>
              </div>
            )}
            <main className="flex-1 pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/agendar" element={<Agendar />} />
                <Route path="/painel" element={<Painel />} />
                <Route path="/produtos" element={<Produtos />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
