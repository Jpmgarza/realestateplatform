import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PropertyList from './pages/PropertyList'
import PropertyDetail from './pages/PropertyDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Feed from './pages/Feed'
import UserProfile from './pages/UserProfile'
import Referrals from './pages/Referrals'
import BusinessList from './pages/BusinessList'
import BusinessDetail from './pages/BusinessDetail'
import BusinessCreate from './pages/BusinessCreate'
import Analytics from './pages/Analytics'
import MyReservations from './pages/MyReservations'
import Messages from './pages/Messages'
import PropertyCreate from './pages/PropertyCreate'
import Drafts from './pages/Drafts'
import Scheduled from './pages/Scheduled'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/properties" element={<PropertyList />} />
                <Route path="/properties/new" element={<PropertyCreate />} />
                <Route path="/properties/:id" element={<PropertyDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/business" element={<BusinessList />} />
                <Route path="/business/create" element={<BusinessCreate />} />
                <Route path="/business/:businessId" element={<BusinessDetail />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/reservations" element={<MyReservations />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/drafts" element={<Drafts />} />
                <Route path="/scheduled" element={<Scheduled />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
