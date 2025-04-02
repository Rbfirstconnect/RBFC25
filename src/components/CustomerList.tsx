import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ArrowUpDown, Check, PhoneCall, Info, Undo2, Calendar, Package } from 'lucide-react';
import { getAllEligibleCustomers } from '../data';
import { auth } from '../firebase';

type SortField = 'activationDate' | 'currentPlan';
type SortDirection = 'asc' | 'desc';

type StoreFilter = {
  value: string;
  label: string;
  count: number;
};

type CustomerListProps = {
  mode?: 'all' | 'called';
};

export function CustomerList({ mode = 'all' }: CustomerListProps) {
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }
  
  const [sortField, setSortField] = useState<SortField>('activationDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [calledCustomers, setCalledCustomers] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('calledCustomers');
    return new Set(saved ? JSON.parse(saved) : []);
  });
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  // Memoize the initial customer data
  const customers = useMemo(() => {
    const data = getAllEligibleCustomers();
    // Pre-format dates for better performance
    return data.map(customer => ({
      ...customer,
      formattedDate: new Date(customer.activationDate).toLocaleDateString()
    }));
  }, []);

  // Memoize the plan filters
  const planFilters = useMemo(() => [
    { value: 'all', label: 'All Plans' },
    ...Array.from(new Set(customers.map(c => c.currentPlan)))
      .map(plan => ({ value: plan, label: plan }))
      .sort((a, b) => a.label.localeCompare(b.label))
  ], [customers]);

  // Memoize the store filters
  const storeFilters: StoreFilter[] = useMemo(() => [
    { value: 'all', label: 'All Stores', count: customers.length },
    ...Object.entries(
      customers.reduce((acc, customer) => {
        acc[customer.storeName] = (acc[customer.storeName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([store, count]) => ({
        value: store,
        label: store,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  ], [customers]);

  const filteredCustomers = useMemo(() => customers.filter(customer => 
    (mode === 'called' ? calledCustomers.has(customer.phoneNumber) : !calledCustomers.has(customer.phoneNumber)) &&
    (selectedStore === 'all' || customer.storeName === selectedStore) &&
    (selectedPlan === 'all' || customer.currentPlan === selectedPlan) &&
    (!dateRange.start || new Date(customer.activationDate) >= new Date(dateRange.start)) &&
    (!dateRange.end || new Date(customer.activationDate) <= new Date(dateRange.end))
  ), [customers, mode, calledCustomers, selectedStore, selectedPlan, dateRange]);

  const sortedCustomers = useMemo(() => [...filteredCustomers].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'currentPlan') {
      return a.currentPlan.localeCompare(b.currentPlan) * direction;
    }
    
    if (sortField === 'activationDate') {
      const dateA = new Date(a[sortField]).getTime();
      const dateB = new Date(b[sortField]).getTime();
      return (dateA - dateB) * direction;
    }
    
    return 0;
  }), [filteredCustomers, sortField, sortDirection]);

  const handleSelectCustomer = useCallback((phoneNumber: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(phoneNumber)) {
      newSelected.delete(phoneNumber);
    } else {
      newSelected.add(phoneNumber);
    }
    setSelectedCustomers(newSelected);
  }, [selectedCustomers]);

  // Save to localStorage whenever calledCustomers changes
  React.useEffect(() => {
    localStorage.setItem('calledCustomers', JSON.stringify(Array.from(calledCustomers)));
  }, [calledCustomers]);

  const handleMarkAsCalled = () => {
    const newCalled = new Set(calledCustomers);
    selectedCustomers.forEach(phoneNumber => {
      newCalled.add(phoneNumber);
    });
    setCalledCustomers(newCalled);
    setSelectedCustomers(new Set());
  };

  const handleMoveBack = () => {
    const newCalled = new Set(calledCustomers);
    selectedCustomers.forEach(phoneNumber => {
      newCalled.delete(phoneNumber);
    });
    setCalledCustomers(newCalled);
    setSelectedCustomers(new Set());
  };

  const handleRemoveFromCalled = (phoneNumber: string) => {
    const newCalled = new Set(calledCustomers);
    newCalled.delete(phoneNumber);
    setCalledCustomers(newCalled);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Memoize row renderer for react-window
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const customer = sortedCustomers[index];
    const isSelected = selectedCustomers.has(customer.phoneNumber);
    const isEven = index % 2 === 0;
    
    return (
      <div 
        style={style} 
        className={`flex divide-x divide-orange-100 transition-all duration-200 ${
          isEven ? 'bg-orange-50/30' : 'bg-white'
        } hover:bg-orange-100/50 hover:shadow-md transform hover:-translate-y-px`}
      >
        <div className="px-2 flex items-center" style={{ width: '60px' }}>
          <button
            onClick={() => handleSelectCustomer(customer.phoneNumber)}
            className={`p-2 rounded-lg transition-colors ${
              isSelected
                ? 'bg-[#FF6900] text-white shadow-sm'
                : 'bg-orange-100 text-[#FF6900] hover:bg-orange-200 hover:shadow-sm'
            }`}
            title="Select customer"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
        <div className="px-3 flex items-center" style={{ width: '150px' }}>
          <span className="font-medium tracking-wide">{customer.phoneNumber}</span>
        </div>
        <div className="px-3 flex items-center" style={{ width: '200px' }}>
          <span className="truncate max-w-[180px]" title={customer.storeName}>
            {customer.storeName}
          </span>
        </div>
        <div className="px-3 flex items-center group relative" style={{ width: '200px' }}>
          <span className="truncate max-w-[160px]" title={customer.currentPlan}>
            {customer.currentPlan}
          </span>
          <button 
            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
            title="View plan details"
            onClick={() => alert(`Plan Details:\n\nPlan: ${customer.currentPlan}\nMonthly Savings: $${customer.monthlySavings}\nYearly Savings: $${customer.yearlySavings}`)}
          >
            <Info className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="px-3 flex items-center" style={{ width: '150px' }}>
          <span className="font-medium">{customer.formattedDate}</span>
        </div>
      </div>
    );
  }, [sortedCustomers, selectedCustomers, handleSelectCustomer]);

  const getSortableHeaderProps = (field: SortField) => ({
    onClick: () => handleSort(field),
    className: `px-6 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider cursor-pointer hover:bg-orange-100 select-none
      ${sortField === field ? 'text-[#FF6900]' : ''}`,
  });

  return (
    <div className="max-w-6xl w-full mx-auto">
      {/* Sticky Filter Section */}
      <div className="sticky top-[100px] z-40 bg-white p-8 rounded-xl shadow-lg border-2 border-orange-200 backdrop-blur-sm bg-white/90">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF6900] to-[#ff8533] bg-clip-text text-transparent">
            {mode === 'called' ? 'Called Customers' : 'Customer Database'}
          </h2>
          <div className="text-sm bg-orange-50 px-4 py-2 rounded-full font-medium text-[#FF6900] border border-orange-200">
            {filteredCustomers.length} customers found
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4" />
              Store Location
            </label>
            <select 
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="block w-full px-4 py-3 bg-white border-2 border-orange-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6900] focus:border-transparent sm:text-sm transition-all hover:border-[#FF6900] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path fill=%22%23FF6900%22 d=%22M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z%22/></svg>')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-12"
            >
              {storeFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label} ({filter.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4" />
              Current Plan
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="block w-full px-4 py-3 bg-white border-2 border-orange-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6900] focus:border-transparent sm:text-sm transition-all hover:border-[#FF6900] cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path fill=%22%23FF6900%22 d=%22M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z%22/></svg>')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-12"
            >
              {planFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              Activation Date From
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="block w-full px-4 py-3 bg-white border-2 border-orange-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6900] focus:border-transparent sm:text-sm transition-all hover:border-[#FF6900] cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              Activation Date To
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="block w-full px-4 py-3 bg-white border-2 border-orange-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6900] focus:border-transparent sm:text-sm transition-all hover:border-[#FF6900] cursor-pointer"
            />
          </div>
        </div>
        
        {/* Action Button */}
        {selectedCustomers.size > 0 && (
          <div className="mt-6 pt-6 border-t-2 border-orange-200">
            {mode === 'all' ? (
              <button
                onClick={handleMarkAsCalled}
                className="w-full bg-gradient-to-r from-[#FF6900] to-[#ff8533] text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:from-[#e65e00] hover:to-[#ff7519] transition-all font-medium shadow-lg shadow-orange-100 hover:shadow-xl hover:shadow-orange-200 transform hover:-translate-y-0.5"
              >
                <PhoneCall className="w-5 h-5" />
                Move {selectedCustomers.size} Customer{selectedCustomers.size > 1 ? 's' : ''} to Called List
              </button>
            ) : (
              <button
                onClick={handleMoveBack}
                className="w-full bg-gradient-to-r from-[#FF6900] to-[#ff8533] text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 hover:from-[#e65e00] hover:to-[#ff7519] transition-all font-medium shadow-lg shadow-orange-100 hover:shadow-xl hover:shadow-orange-200 transform hover:-translate-y-0.5"
              >
                <Undo2 className="w-5 h-5" />
                Move {selectedCustomers.size} Customer{selectedCustomers.size > 1 ? 's' : ''} Back to Main List
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-orange-200 mt-32 relative z-30">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="bg-orange-50 flex divide-x divide-orange-100 border-b-2 border-orange-200 sticky top-0 z-20 shadow-sm rounded-lg">
              <div className="px-2 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider" style={{ width: '60px' }}>
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#FF6900]" />
                  </div>
                </div>
              </div>
              <div className="px-3 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider" style={{ width: '150px' }}>Phone</div>
              <div className="px-3 py-3 text-left text-xs font-medium text-[#FF6900] uppercase tracking-wider" style={{ width: '200px' }}>Store</div>
              <div {...getSortableHeaderProps('currentPlan')} style={{ width: '200px' }}>
                  <div className="flex items-center gap-1 px-3 py-3">
                    Current Plan
                    <ArrowUpDown className="w-4 h-4 text-[#FF6900]" />
                  </div>
              </div>
              <div {...getSortableHeaderProps('activationDate')} style={{ width: '150px' }}>
                  <div className="flex items-center gap-1 px-3 py-3">
                    Activated
                    <ArrowUpDown className="w-4 h-4 text-[#FF6900]" />
                  </div>
              </div>
            </div>
            <List
              height={500}
              itemCount={sortedCustomers.length}
              itemSize={52}
              width="100%"
              className="bg-white divide-y divide-orange-100 rounded-b-xl overflow-hidden"
            >
              {Row}
            </List>
          </div>
        </div>
      </div>
    </div>
  );
}