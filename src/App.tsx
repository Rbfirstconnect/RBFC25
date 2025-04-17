import React from 'react';
import { useState, useEffect } from 'react';
import { Search, Phone, CheckCircle, XCircle, Users, PhoneCall, History, Mail, Download } from 'lucide-react';
import { auth, db, isUserAdmin } from './firebase';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { Fireworks } from './components/Fireworks';
import { WaterSplashAnimation } from './components/WaterSplashAnimation';
import { EmojiErrorAnimation } from './components/EmojiErrorAnimation';
import { ProfilePage } from './components/ProfilePage';
import { checkEligibility, EligibilityResult } from './data';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CustomerList } from './components/CustomerList';
import { Watermark } from './components/Watermark';

function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult>({ isEligible: false });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'checker' | 'list' | 'called' | 'history' | 'profile'>('checker');
  const [showFireworks, setShowFireworks] = useState(false);
  const [showIneligibleAnimation, setShowIneligibleAnimation] = useState(false);
  const [showEmojiError, setShowEmojiError] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'eligible' | 'not-eligible'>('all');
  const [checkedByFilter, setCheckedByFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [lookupHistory, setLookupHistory] = useState<Array<{
    id?: string;
    phoneNumber: string;
    timestamp: string;
    isEligible: boolean;
    customerInfo?: any;
    checkedBy?: string;
    userId?: string;
  }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch lookup history from Firestore
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLookupHistory([]);
        return;
      }

      try {
        // Check if user is admin
        const adminStatus = await isUserAdmin(user.uid);
        setIsAdmin(adminStatus);

        const historyRef = collection(db, 'lookupHistory');
        
        // All users can see all records, ordered by timestamp
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        
        const querySnapshot = await getDocs(q);
        let history = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate().toISOString()
        }));

        setLookupHistory(history);
      } catch (error) {
        console.error('Error fetching history:', error);
        setLookupHistory([]); // Reset history on error
      }
    };

    fetchHistory();
  }, [user, sortOrder]);

  // Fetch users for admin filter
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: `${doc.data().displayName || 'Unknown User'} (${doc.data().email || 'No email'})`
        }));
        // Add "All Users" option at the beginning
        setUsers([
          { id: 'all', name: 'All Users' },
          ...userData.sort((a, b) => a.name.localeCompare(b.name))
        ]);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([{ id: 'all', name: 'All Users' }]);
      }
    };
    
    fetchUsers();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = () => {
    if (!user) {
      alert('Please sign in to use the eligibility checker');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
      setShowEmojiError(true);
      return;
    }

    setIsLoading(true);
    const result = checkEligibility(phoneNumber);
    // Simulate API call for better UX
    setTimeout(async () => {
      // Prepare history entry with null for undefined values
      const historyEntry = {
        phoneNumber,
        timestamp: new Date(),
        isEligible: result.isEligible,
        customerInfo: result.isEligible ? {
          name: result.customerInfo?.name || null,
          storeName: result.customerInfo?.storeName || null,
          activationDate: result.customerInfo?.activationDate || null,
          currentPlan: result.customerInfo?.currentPlan || null,
          monthlySavings: result.customerInfo?.monthlySavings || null,
          yearlySavings: result.customerInfo?.yearlySavings || null
        } : null,
        userId: user.uid,
        checkedBy: user.displayName || user.email
      };
      
      try {
        const docRef = await addDoc(collection(db, 'lookupHistory'), historyEntry);
        const newHistory = [{
          id: docRef.id,
          ...historyEntry,
          timestamp: historyEntry.timestamp.toISOString()
        }, ...lookupHistory];
        setLookupHistory(newHistory);
      } catch (error) {
        console.error('Error saving lookup:', error);
      }

      if (!result.isEligible) {
        setShowIneligibleAnimation(true);
      }
      setEligibilityResult(result);
      setHasSearched(true);
      setIsLoading(false);
      if (result.isEligible) {
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 4000);
      }
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white overflow-hidden">
      {showFireworks && <Fireworks duration={4000} />}
      <Watermark />
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header onProfileClick={() => setActiveTab('profile')} />
        {!user ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-2 border-orange-200 text-center">
              <div className="bg-[#FF6900] bg-opacity-10 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Phone className="w-8 h-8 text-[#FF6900]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to access the $25 Plan Eligibility Checker and customer management features.
              </p>
            </div>
          </div>
        ) : !user.emailVerified ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-2 border-orange-200 text-center">
              <div className="bg-[#FF6900] bg-opacity-10 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Mail className="w-8 h-8 text-[#FF6900]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Verification Required</h2>
              <p className="text-gray-600 mb-6">
                Please verify your email address to access all features. Check your inbox for the verification link.
              </p>
              <button
                onClick={async () => {
                  try {
                    await sendEmailVerification(user);
                    alert('Verification email sent! Please check your inbox.');
                  } catch (error) {
                    console.error('Error sending verification email:', error);
                    alert('Error sending verification email. Please try again later.');
                  }
                }}
                className="bg-[#FF6900] text-white px-6 py-3 rounded-lg hover:bg-[#e65e00] transition-all font-medium"
              >
                Resend Verification Email
              </button>
            </div>
          </div>
        ) : (
        <nav className="bg-white shadow-md px-4 py-1">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('checker')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                activeTab === 'checker'
                  ? 'bg-[#FF6900] text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-50'
              }`}
            >
              <Phone className="w-5 h-5 mr-2" />
              Eligibility Checker
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                activeTab === 'list'
                  ? 'bg-[#FF6900] text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-50'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Customer Database
            </button>
            <button
              onClick={() => setActiveTab('called')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                activeTab === 'called'
                  ? 'bg-[#FF6900] text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-50'
              }`}
            >
              <PhoneCall className="w-5 h-5 mr-2" />
              Called List
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                activeTab === 'history'
                  ? 'bg-[#FF6900] text-white'
                  : 'bg-white text-gray-600 hover:bg-orange-50'
              }`}
            >
              <History className="w-5 h-5 mr-2" />
              Lookup History
            </button>
          </div>
        </nav>
        )}
      </div>
      
      <main className="flex-1 overflow-auto pt-24 px-4 pb-14 flex items-center">
        <div className="w-full max-w-6xl mx-auto">
          {!user ? null : (() => {
            if (activeTab === 'checker') {
              return (
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border-2 border-orange-200 mx-auto mt-16">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-[#FF6900] bg-opacity-10 p-4 rounded-full">
                  <Phone className="w-12 h-12 text-[#FF6900]" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
                $25 Plan Eligibility Checker
              </h1>
              
              <p className="text-gray-600 text-center mb-8">
                Check if your customer qualifies for our exclusive $25 savings plan
              </p>

              <div className="relative mb-6">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setShowEmojiError(false);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-4 rounded-xl border-2 border-orange-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent outline-none transition-all pl-12 text-lg hover:border-[#FF6900]"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>

              <button
                onClick={handleSearch}
                disabled={isLoading}
                className={`w-full bg-[#FF6900] text-white py-4 rounded-xl hover:bg-[#e65e00] transition-all font-medium text-lg relative
                  ${isLoading ? 'opacity-90 cursor-wait' : ''}`}
              >
                {isLoading ? 'Checking...' : 'Check Eligibility'}
              </button>

              {showEmojiError && (
                <div className="mt-6">
                  <EmojiErrorAnimation onComplete={() => setShowEmojiError(false)} />
                  <p className="text-red-500 text-center text-sm mt-2 font-medium">
                    {!phoneNumber.match(/^\d{10}$/) 
                      ? "Please enter a valid 10-digit phone number"
                      : "Customer does not qualify for the $25 savings plan"
                    }
                  </p>
                </div>
              )}

              {hasSearched && (
                <div className={`mt-6 p-4 rounded-lg flex items-center ${
                  eligibilityResult.isEligible ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
                } ${showIneligibleAnimation ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] transform transition-all`}
                  onClick={() => eligibilityResult.isEligible && setShowThankYou(true)}
                >
                  {eligibilityResult.isEligible && eligibilityResult.customerInfo ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-800">Eligible!</p>
                        <div className="text-sm text-green-700">
                          <div className="font-bold text-base mt-1">
                            <p>{eligibilityResult.customerInfo.name}</p>
                            <p className="text-gray-600">{eligibilityResult.customerInfo.storeName}</p>
                          </div>
                          <p>Activation Date: {eligibilityResult.customerInfo.activationDate}</p>
                          <p>Current Plan: {eligibilityResult.customerInfo.currentPlan}</p>
                          <div className="mt-3 bg-white rounded-lg p-3 border-2 border-green-200">
                            <p className="text-[#FF6900] font-bold">
                              Monthly Savings: ${eligibilityResult.customerInfo.monthlySavings}
                            </p>
                            <p className="text-[#FF6900] font-bold">
                              Yearly Savings: ${eligibilityResult.customerInfo.yearlySavings}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600 mr-3" />
                      <div>
                        <p className="font-medium text-red-800 text-lg">Not Eligible</p>
                        <p className="text-sm text-red-600 mt-1">
                          Customer does not qualify for the $25 savings plan.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Thank You Modal */}
              {showThankYou && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4 transform animate-[slideIn_0.3s_ease-out]">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Congratulations!</h3>
                      <div className="text-left bg-green-50 p-4 rounded-lg border-2 border-green-200 mb-6">
                        <p className="font-medium text-green-800 mb-2">Your customer is eligible for:</p>
                        <ol className="space-y-2 text-gray-700">
                          <li className="flex items-center gap-2">
                            <span className="text-[#FF6900] font-bold">1)</span>
                            $25 off the Activation fee on add a line
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#FF6900] font-bold">2)</span>
                            25% off on any Bluetooth speaker
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#FF6900] font-bold">3)</span>
                            $25 off on tire 3 and tier 4 accessory bundle
                          </li>
                        </ol>
                      </div>
                      <button
                        onClick={() => setShowThankYou(false)}
                        className="bg-[#FF6900] text-white px-6 py-2 rounded-lg hover:bg-[#e65e00] transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {!eligibilityResult.isEligible && showIneligibleAnimation && (
                <div className="mt-6">
                  <WaterSplashAnimation 
                    onComplete={() => setShowIneligibleAnimation(false)} 
                  />
                </div>
              )}
            </div>
              );
            } else if (activeTab === 'list') {
              return <CustomerList />;
            } else if (activeTab === 'called') {
              return <CustomerList mode="called" />;
            } else if (activeTab === 'history') {
              return (
                <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[#FF6900]">Lookup History</h2>
                    <button
                      onClick={() => {
                        import('xlsx').then(XLSX => {
                          // Filter data based on current filters
                          const filteredData = lookupHistory
                            .filter(entry => {
                              if (statusFilter === 'all') return true;
                              return statusFilter === 'eligible' ? entry.isEligible : !entry.isEligible;
                            })
                            .filter(entry => {
                              const date = new Date(entry.timestamp);
                              const start = dateFilter.start ? new Date(dateFilter.start) : null;
                              const end = dateFilter.end ? new Date(dateFilter.end) : null;
                              
                              if (start && date < start) return false;
                              if (end) {
                                end.setHours(23, 59, 59, 999);
                                if (date > end) return false;
                              }
                              return true;
                            })
                            .map(entry => ({
                              'Phone Number': entry.phoneNumber,
                              'Checked By': entry.checkedBy,
                              'Date & Time': new Date(entry.timestamp).toLocaleString(),
                              'Status': entry.isEligible ? 'Eligible' : 'Not Eligible',
                              'Customer Name': entry.isEligible && entry.customerInfo ? entry.customerInfo.name : '',
                              'Store': entry.isEligible && entry.customerInfo ? entry.customerInfo.storeName : '',
                              'Monthly Savings': entry.isEligible && entry.customerInfo ? `$${entry.customerInfo.monthlySavings}` : '',
                              'Yearly Savings': entry.isEligible && entry.customerInfo ? `$${entry.customerInfo.yearlySavings}` : ''
                            }));

                          const ws = XLSX.utils.json_to_sheet(filteredData);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, 'Lookup History');
                          
                          // Generate filename with current date
                          const date = new Date().toISOString().split('T')[0];
                          XLSX.writeFile(wb, `lookup-history-${date}.xlsx`);
                        });
                      }}
                      className="flex items-center gap-2 bg-[#FF6900] text-white px-4 py-2 rounded-lg hover:bg-[#e65e00] transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download Excel
                    </button>
                  </div>
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Checked By</label>
                      <select
                        value={checkedByFilter}
                        onChange={(e) => setCheckedByFilter(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-orange-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path fill=%22%23FF6900%22 d=%22M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z%22/></svg>')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-12"
                      >
                        <option value="all">All Users</option>
                        {Array.from(new Set(lookupHistory.map(entry => entry.checkedBy))).map(checker => (
                          <option key={checker} value={checker}>{checker}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'eligible' | 'not-eligible')}
                        className="w-full px-4 py-2 rounded-lg border-2 border-orange-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="eligible">Eligible</option>
                        <option value="not-eligible">Not Eligible</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                      <input
                        type="date"
                        value={dateFilter.start}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border-2 border-orange-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                      <input
                        type="date"
                        value={dateFilter.end}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border-2 border-orange-200 focus:ring-2 focus:ring-[#FF6900] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border-2 border-orange-200">
                    <table className="min-w-full divide-y divide-orange-200">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider">Phone Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider">Checked By</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider">Date & Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-orange-100">
                        {lookupHistory
                          .filter(entry => {
                            if (statusFilter === 'all') return true;
                            return statusFilter === 'eligible' ? entry.isEligible : !entry.isEligible;
                          })
                          .filter(entry => checkedByFilter === 'all' || entry.checkedBy === checkedByFilter)
                          .filter(entry => {
                            const date = new Date(entry.timestamp);
                            const start = dateFilter.start ? new Date(dateFilter.start) : null;
                            const end = dateFilter.end ? new Date(dateFilter.end) : null;
                            
                            if (start && date < start) return false;
                            if (end) {
                              end.setHours(23, 59, 59, 999);
                              if (date > end) return false;
                            }
                            return true;
                          })
                          .map((entry, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-orange-50/30' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.phoneNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.checkedBy}
                              {isAdmin && entry.userId && (
                                <span className="ml-1 text-xs text-[#FF6900]">({entry.userId})</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(entry.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                entry.isEligible 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {entry.isEligible ? 'Eligible' : 'Not Eligible'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.isEligible && entry.customerInfo && (
                                <div>
                                  <p>{entry.customerInfo.name}</p>
                                  <p className="text-xs text-gray-400">{entry.customerInfo.storeName}</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            } else if (activeTab === 'profile') {
              return <ProfilePage />;
            }
            return null;
          })()}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App
