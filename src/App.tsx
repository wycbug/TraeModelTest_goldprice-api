import { useState, useEffect, useMemo } from 'react'
import './index.css'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import Papa from 'papaparse'
import { RefreshCw, Download, TrendingUp, TrendingDown, Clock } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title
)

interface GoldPriceItem {
  id: string
  dir: string
  title: string
  changepercent: string
  maxprice: number
  minprice: number
  buyprice: number
  recycleprice: number
  date: string
}

interface GoldPriceData {
  code: number
  msg: string
  time: string
  price: string
  data: GoldPriceItem[]
}

function App() {
  const [goldPriceData, setGoldPriceData] = useState<GoldPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortField, setSortField] = useState<keyof GoldPriceItem | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [retryCount, setRetryCount] = useState(0)
  const [isStale, setIsStale] = useState(false)

  const fetchGoldPriceData = async (isRetry = false) => {
    try {
      setLoading(true)
      setError('')
      setIsStale(false)
      
      const response = await fetch('/api/goldprice', {
        signal: AbortSignal.timeout(15000)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json() as GoldPriceData & { stale?: boolean }
      
      if (data.stale) {
        setIsStale(true)
      }
      
      setGoldPriceData(data)
      setRetryCount(0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      
      if (isRetry && retryCount < 3 && errorMessage.includes('fetch')) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          fetchGoldPriceData(true)
        }, Math.pow(2, retryCount) * 1000)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoldPriceData()
  }, [])

  const handleSort = (field: keyof GoldPriceItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!goldPriceData?.data || !sortField) return goldPriceData?.data || []

    return [...goldPriceData.data].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (sortField === 'changepercent') {
        const aNum = parseFloat(String(aValue).replace('+', ''))
        const bNum = parseFloat(String(bValue).replace('+', ''))
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      return sortDirection === 'asc' 
        ? String(aValue).localeCompare(String(bValue)) 
        : String(bValue).localeCompare(String(aValue))
    })
  }, [goldPriceData?.data, sortField, sortDirection])

  const handleExportCSV = () => {
    if (!goldPriceData?.data) return

    const csv = Papa.unparse(goldPriceData.data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `gold_prices_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportExcel = () => {
    if (!goldPriceData?.data) return

    const csv = Papa.unparse(goldPriceData.data)
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `gold_prices_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const pieChartData = useMemo(() => {
    if (!goldPriceData?.data) return { labels: [], datasets: [] }

    const top5Items = [...goldPriceData.data]
      .sort((a, b) => b.buyprice - a.buyprice)
      .slice(0, 5)

    return {
      labels: top5Items.map(item => item.title),
      datasets: [
        {
          label: '买入价 (元)',
          data: top5Items.map(item => item.buyprice),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(168, 85, 247, 1)',
          ],
          borderWidth: 1,
        },
      ],
    }
  }, [goldPriceData?.data])

  const barChartData = useMemo(() => {
    if (!goldPriceData?.data) return { labels: [], datasets: [] }

    const sortedByChange = [...goldPriceData.data]
      .sort((a, b) => parseFloat(b.changepercent.replace('+', '')) - parseFloat(a.changepercent.replace('+', '')))
      .slice(0, 10)

    return {
      labels: sortedByChange.map(item => item.title),
      datasets: [
        {
          label: '涨跌幅 (%)',
          data: sortedByChange.map(item => parseFloat(item.changepercent.replace('+', ''))),
          backgroundColor: sortedByChange.map(item => 
            parseFloat(item.changepercent.replace('+', '')) >= 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'
          ),
        },
      ],
    }
  }, [goldPriceData?.data])

  const priceRangeChartData = useMemo(() => {
    if (!goldPriceData?.data) return { labels: [], datasets: [] }

    const topItems = [...goldPriceData.data]
      .sort((a, b) => b.buyprice - a.buyprice)
      .slice(0, 8)

    return {
      labels: topItems.map(item => item.title),
      datasets: [
        {
          label: '最高价',
          data: topItems.map(item => item.maxprice),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
        {
          label: '最低价',
          data: topItems.map(item => item.minprice),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: '买入价',
          data: topItems.map(item => item.buyprice),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
        },
        {
          label: '卖出价',
          data: topItems.map(item => item.recycleprice),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
      ],
    }
  }, [goldPriceData?.data])

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '黄金价格分析',
      },
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900">加载黄金价格数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-red-600 mb-2">加载失败</h2>
          <p className="text-sm text-gray-600 mb-4">无法获取黄金价格数据</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => fetchGoldPriceData(true)} 
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">今日黄金价格</h1>
              <p className="text-gray-600">实时黄金价格监控与分析</p>
            </div>
            <button 
              onClick={() => fetchGoldPriceData(true)} 
              disabled={loading}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '刷新中...' : '刷新数据'}
            </button>
          </div>
        </div>
      </header>

      {goldPriceData && (
        <main className="container mx-auto px-4 py-8">
          {/* Summary Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-blue-600">
                  ¥{goldPriceData.price}
                </h2>
                <p className="flex items-center mt-2 text-gray-600">
                  <Clock className="mr-2 h-4 w-4" />
                  获取时间: {goldPriceData.time}
                  {isStale && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      缓存数据
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">数据状态</div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  goldPriceData.code === 200 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {goldPriceData.code === 200 ? '正常' : '异常'}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">黄金价格分布 (Top 5)</h3>
              <p className="text-sm text-gray-600 mb-4">按买入价排序的前5种黄金</p>
              <Pie data={pieChartData} options={chartOptions} />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">涨跌幅对比 (Top 10)</h3>
              <p className="text-sm text-gray-600 mb-4">涨跌幅最大的前10种黄金</p>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">价格区间对比 (Top 8)</h3>
            <p className="text-sm text-gray-600 mb-4">不同黄金类型的价格区间对比</p>
            <Bar data={priceRangeChartData} options={chartOptions} />
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">详细价格表</h3>
                  <p className="text-sm text-gray-600">所有黄金类型的详细价格信息</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={handleExportCSV}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    导出CSV
                  </button>
                  <button 
                    onClick={handleExportExcel}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    导出Excel
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('dir')}
                    >
                      类别 
                      {sortField === 'dir' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('title')}
                    >
                      名称 
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('changepercent')}
                    >
                      涨跌幅 
                      {sortField === 'changepercent' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('maxprice')}
                    >
                      最高价 
                      {sortField === 'maxprice' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('minprice')}
                    >
                      最低价 
                      {sortField === 'minprice' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('buyprice')}
                    >
                      买入价 
                      {sortField === 'buyprice' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('recycleprice')}
                    >
                      卖出价 
                      {sortField === 'recycleprice' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      日期 
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.dir}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {parseFloat(item.changepercent) >= 0 ? (
                            <TrendingUp className="mr-1 h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingDown className="mr-1 h-4 w-4 text-green-500" />
                          )}
                          <span className={parseFloat(item.changepercent) >= 0 ? 'price-up' : 'price-down'}>
                            {item.changepercent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{item.maxprice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{item.minprice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{item.buyprice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{item.recycleprice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>数据来源: <a href="https://api.pearktrue.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">api.pearktrue.cn</a></p>
            <p className="mt-2">基于 Cloudflare Workers 构建</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App