import React, { useState, useCallback } from 'react'
import { usePlots, useColonies } from '../hooks/useData'
import { AlertCircle, RefreshCw, Filter, Search, MapPin, Home, IndianRupee, Square } from 'lucide-react'

/**
 * Production-ready Data Display Component
 * Demonstrates proper loading states, error handling, and data presentation
 */

const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
    <p className="text-gray-600 text-sm">{message}</p>
  </div>
)

const ErrorDisplay = ({ error, onRetry, canRetry = true }) => {
  const getErrorMessage = () => {
    if (!error) return 'An unknown error occurred'
    
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection.'
      case 'NOT_FOUND':
        return 'The requested data was not found.'
      case 'VALIDATION_ERROR':
        return 'There was a validation error with your request.'
      case 'FETCH_ERROR':
        return 'Failed to fetch data from the server.'
      default:
        return error.message || 'An error occurred while fetching data.'
    }
  }

  const getErrorIcon = () => {
    switch (error?.code) {
      case 'NETWORK_ERROR':
        return '🌐'
      case 'NOT_FOUND':
        return '🔍'
      default:
        return '❌'
    }
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
          <p className="text-red-700 mb-4">{getErrorMessage()}</p>
          
          {error?.details && (
            <details className="mb-4">
              <summary className="text-red-600 cursor-pointer text-sm">Technical Details</summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
          
          {canRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}
        </div>
        <div className="text-2xl">{getErrorIcon()}</div>
      </div>
    </div>
  )
}

const EmptyState = ({ message = 'No data available', onRefresh }) => (
  <div className="text-center py-12">
    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <Search className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
    <p className="text-gray-500 mb-4">Try adjusting your search criteria or refresh the data.</p>
    {onRefresh && (
      <button
        onClick={onRefresh}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </button>
    )}
  </div>
)

const PlotCard = ({ plot, onSelect }) => {
  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      sold: 'bg-red-100 text-red-800',
      blocked: 'bg-yellow-100 text-yellow-800',
      reserved: 'bg-blue-100 text-blue-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 p-6"
      onClick={() => onSelect?.(plot)}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Plot {plot.plotNumber}</h3>
          <p className="text-sm text-gray-600 flex items-center mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            {plot.colony?.name || 'Unknown Colony'}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plot.status)}`}>
          {plot.status?.toUpperCase()}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-gray-700">
          <Square className="w-4 h-4 mr-2 text-blue-600" />
          <span className="text-sm">{plot.area} sq ft</span>
        </div>
        <div className="flex items-center text-gray-700">
          <Home className="w-4 h-4 mr-2 text-blue-600" />
          <span className="text-sm">{plot.facing}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-gray-900 flex items-center">
          <IndianRupee className="w-5 h-5 mr-1" />
          {formatPrice(plot.totalPrice)}
        </div>
        <div className="text-sm text-gray-600">
          ₹{plot.pricePerSqFt}/sq ft
        </div>
      </div>
      
      {plot.corner && (
        <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
          Corner Plot
        </div>
      )}
    </div>
  )
}

const FilterPanel = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isExpanded ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={localFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="blocked">Blocked</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facing</label>
              <select
                value={localFilters.facing || ''}
                onChange={(e) => handleFilterChange('facing', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Directions</option>
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="east">East</option>
                <option value="west">West</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                value={localFilters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min Price"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const ProductionDataDisplay = () => {
  const [filters, setFilters] = useState({})
  const [selectedPlot, setSelectedPlot] = useState(null)
  const [selectedColony, setSelectedColony] = useState(null)

  // Fetch colonies for filter
  const { 
    data: colonies, 
    loading: coloniesLoading, 
    error: coloniesError 
  } = useColonies({}, { enabled: true })

  // Fetch plots with filters
  const { 
    data: plots, 
    loading: plotsLoading, 
    error: plotsError, 
    refetch: refetchPlots,
    isRefetching 
  } = usePlots({
    ...filters,
    colony: selectedColony
  }, { 
    enabled: true,
    cache: true,
    retry: 3 
  })

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  const handlePlotSelect = useCallback((plot) => {
    setSelectedPlot(plot)
    console.log('Selected plot:', plot)
  }, [])

  const handleRefresh = useCallback(() => {
    refetchPlots()
  }, [refetchPlots])

  // Show loading state
  if (plotsLoading && !isRefetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="large" message="Loading plots data..." />
        </div>
      </div>
    )
  }

  // Show error state
  if (plotsError && !plots.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorDisplay 
            error={plotsError} 
            onRetry={handleRefresh}
            canRetry={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Property Listings</h1>
              <p className="text-gray-600 mt-2">Browse available plots and properties</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {isRefetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Colony Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Colony</label>
          <select
            value={selectedColony || ''}
            onChange={(e) => setSelectedColony(e.target.value)}
            disabled={coloniesLoading}
            className="w-full md:w-64 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">All Colonies</option>
            {colonies?.map(colony => (
              <option key={colony._id} value={colony._id}>
                {colony.name}
              </option>
            ))}
          </select>
          {coloniesError && (
            <p className="text-red-600 text-sm mt-1">Failed to load colonies</p>
          )}
        </div>

        {/* Filters */}
        <FilterPanel filters={filters} onFiltersChange={handleFilterChange} />

        {/* Results Summary */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Found {plots.length} plot{plots.length !== 1 ? 's' : ''}
            {selectedColony && colonies && (
              <span className="ml-1">
                in {colonies.find(c => c._id === selectedColony)?.name}
              </span>
            )}
          </p>
          {isRefetching && (
            <div className="flex items-center text-blue-600 text-sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Updating...
            </div>
          )}
        </div>

        {/* Plots Grid */}
        {plots.length === 0 ? (
          <EmptyState 
            message="No plots found matching your criteria"
            onRefresh={handleRefresh}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plots.map(plot => (
              <PlotCard 
                key={plot._id} 
                plot={plot} 
                onSelect={handlePlotSelect}
              />
            ))}
          </div>
        )}

        {/* Selected Plot Details Modal */}
        {selectedPlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Plot Details</h2>
                  <button
                    onClick={() => setSelectedPlot(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Plot Number</label>
                      <p className="text-lg font-semibold">{selectedPlot.plotNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        selectedPlot.status === 'available' ? 'bg-green-100 text-green-800' :
                        selectedPlot.status === 'sold' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedPlot.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Area</label>
                      <p className="text-lg">{selectedPlot.area} sq ft</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Facing</label>
                      <p className="text-lg capitalize">{selectedPlot.facing}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price per sq ft</label>
                      <p className="text-lg">₹{selectedPlot.pricePerSqFt}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Price</label>
                      <p className="text-lg font-bold">₹{selectedPlot.totalPrice?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {selectedPlot.colony && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Colony</label>
                      <p className="text-lg">{selectedPlot.colony.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductionDataDisplay