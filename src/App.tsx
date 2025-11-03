import { useState, useEffect, useMemo } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import cloudflareLogo from './assets/Cloudflare_Logo.svg'
import './App.css'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import Papa from 'papaparse'

// Register Chart.js components
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title
)

interface GoldPriceItem {
  id: string
  dir: string
  title: string
  changepercent: string
  maxprice: string
  minprice: string
  buyprice: string
  recycleprice: string
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
  const [exportFields, setExportFields] = useState<Record<keyof GoldPriceItem, boolean>>({
    id: false,
    dir: true,
    title: true,
    changepercent: true,
    maxprice: true,
    minprice: true,
    buyprice: true,
    recycleprice: true,
    date: true
  })

  const fetchGoldPriceData = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/goldprice')
      if (!response.ok) {
        throw new Error('Failed to fetch gold price data')
      }
      const data = await response.json() as GoldPriceData
      setGoldPriceData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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

      // Handle numeric sorting for price fields
      if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
        return sortDirection === 'asc' 
          ? Number(aValue) - Number(bValue) 
          : Number(bValue) - Number(aValue)
      }

      // Handle string sorting for other fields
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue)
    })
  }, [goldPriceData?.data, sortField, sortDirection])

  const handleExportCSV = () => {
    if (!goldPriceData?.data) return

    const filteredData = goldPriceData.data.map(item => {
      const filteredItem: Partial<GoldPriceItem> = {}
      Object.entries(exportFields).forEach(([key, value]) => {
        if (value) {
          filteredItem[key as keyof GoldPriceItem] = item[key as keyof GoldPriceItem]
        }
      })
      return filteredItem
    })

    const csv = Papa.unparse(filteredData)
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

  // Prepare chart data
  const pieChartData = useMemo(() => {
    if (!goldPriceData?.data) return { labels: [], datasets: [] }

    // Get top 5 items by buyprice
    const top5Items = [...goldPriceData.data]
      .sort((a, b) => Number(b.buyprice) - Number(a.buyprice))
      .slice(0, 5)

    return {
      labels: top5Items.map(item => item.title),
      datasets: [
        {
          label: 'Buy Price (元)',
          data: top5Items.map(item => Number(item.buyprice)),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    }
  }, [goldPriceData?.data])

  const barChartData = useMemo(() => {
    if (!goldPriceData?.data) return { labels: [], datasets: [] }

    // Get items with highest and lowest change percent
    const sortedByChange = [...goldPriceData.data]
      .sort((a, b) => Number(b.changepercent) - Number(a.changepercent))
      .slice(0, 10)

    return {
      labels: sortedByChange.map(item => item.title),
      datasets: [
        {
          label: 'Change Percent (%)',
          data: sortedByChange.map(item => Number(item.changepercent)),
          backgroundColor: sortedByChange.map(item => 
            Number(item.changepercent) >= 0 ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)'
          ),
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
        text: 'Gold Price Analysis',
      },
    },
  }

  return (
    <div className='app-container'>
      <header className='app-header'>
        <div className='logo-container'>
          <a href='https://vite.dev' target='_blank'>
            <img src={viteLogo} className='logo' alt='Vite logo' />
          </a>
          <a href='https://react.dev' target='_blank'>
            <img src={reactLogo} className='logo react' alt='React logo' />
          </a>
          <a href='https://workers.cloudflare.com/' target='_blank'>
            <img src={cloudflareLogo} className='logo cloudflare' alt='Cloudflare logo' />
          </a>
        </div>
        <h1>今日黄金价格</h1>
      </header>

      {loading && <div className='loading'>加载中...</div>}
      {error && <div className='error'>{error}</div>}

      {goldPriceData && (
        <main className='app-main'>
          <div className='summary-section'>
            <div className='summary-header'>
              <h2>{goldPriceData.price}</h2>
              <div className='summary-time'>获取时间: {goldPriceData.time}</div>
              <button 
                className='refresh-button' 
                onClick={fetchGoldPriceData} 
                disabled={loading}
              >
                {loading ? '刷新中...' : '刷新数据'}
              </button>
            </div>
          </div>

          <div className='chart-section'>
            <div className='chart-container'>
              <h3>黄金价格分布 (Top 5)</h3>
              <Pie data={pieChartData} options={chartOptions} />
            </div>
            <div className='chart-container'>
              <h3>涨跌幅对比 (Top 10)</h3>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>

          <div className='table-section'>
            <div className='table-header'>
              <h3>详细价格表</h3>
              <div className='export-controls'>
                <h4>选择导出字段:</h4>
                <div className='export-fields'>
                  {Object.entries(exportFields).map(([key, value]) => (
                    <label key={key} className='field-checkbox'>
                      <input
                        type='checkbox'
                        checked={value}
                        onChange={(e) => setExportFields(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                      />
                      {key === 'id' ? '序号' : 
                        key === 'dir' ? '类别' : 
                        key === 'title' ? '名称' : 
                        key === 'changepercent' ? '涨跌幅' : 
                        key === 'maxprice' ? '最高价' : 
                        key === 'minprice' ? '最低价' : 
                        key === 'buyprice' ? '买入价' : 
                        key === 'recycleprice' ? '卖出价' : '日期'}
                    </label>
                  ))}
                </div>
                <button 
                  className='export-button' 
                  onClick={handleExportCSV}
                  disabled={Object.values(exportFields).every(v => !v)}
                >
                  导出CSV
                </button>
              </div>
            </div>
            <div className='table-container'>
              <table className='gold-price-table'>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('dir')} className='sortable'>
                      类别 {sortField === 'dir' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('title')} className='sortable'>
                      名称 {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('changepercent')} className='sortable'>
                      涨跌幅 {sortField === 'changepercent' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('maxprice')} className='sortable'>
                      最高价 {sortField === 'maxprice' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('minprice')} className='sortable'>
                      最低价 {sortField === 'minprice' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('buyprice')} className='sortable'>
                      买入价 {sortField === 'buyprice' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('recycleprice')} className='sortable'>
                      卖出价 {sortField === 'recycleprice' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('date')} className='sortable'>
                      日期 {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map(item => (
                    <tr key={item.id}>
                      <td>{item.dir}</td>
                      <td>{item.title}</td>
                      <td className={Number(item.changepercent) >= 0 ? 'up' : 'down'}>
                        {item.changepercent}%
                      </td>
                      <td>{item.maxprice} 元</td>
                      <td>{item.minprice} 元</td>
                      <td>{item.buyprice} 元</td>
                      <td>{item.recycleprice} 元</td>
                      <td>{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      <footer className='app-footer'>
        <p>数据来源: <a href='https://api.pearktrue.cn/' target='_blank'>api.pearktrue.cn</a></p>
      </footer>
    </div>
  )
}

export default App
