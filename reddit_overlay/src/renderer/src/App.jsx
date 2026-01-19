import { useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App() {
  const [subreddit, setSubreddit] = useState('javascript')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [rssData, setRssData] = useState('')
  const [posts, setPosts] = useState([])
  const [currentPostIndex, setCurrentPostIndex] = useState(0)

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  // Parse RSS XML to extract posts - similar to your example
  const parseRss = (xmlString) => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml')
      
      // Check if it's an RSS feed (with <item> elements) or Atom feed (with <entry> elements)
      const items = xmlDoc.querySelectorAll('item')
      const entries = xmlDoc.querySelectorAll('entry')
      
      let parsedPosts = []
      
      if (entries.length > 0) {
        // Atom feed format (like Reddit RSS)
        parsedPosts = Array.from(entries).map((entry, index) => {
          const title = entry.querySelector('title')?.textContent || 'No title'
          const link = entry.querySelector('link')?.getAttribute('href') || '#'
          const contentElement = entry.querySelector('content')
          const contentHtml = contentElement?.textContent || contentElement?.innerHTML || 'No content'
          const updated = entry.querySelector('updated')?.textContent || 'No date'
          const author = entry.querySelector('author name')?.textContent || 'Unknown'
          
          return {
            id: index,
            title: title,
            link: link,
            contentHtml: contentHtml,
            pubDate: updated,
            author: author
          }
        })
      } else if (items.length > 0) {
        // RSS feed format
        parsedPosts = Array.from(items).map((item, index) => {
          const title = item.querySelector('title')?.textContent || 'No title'
          const description = item.querySelector('description')?.textContent || 'No description'
          const link = item.querySelector('link')?.textContent || '#'
          const pubDate = item.querySelector('pubDate')?.textContent || 'No date'
          
          return {
            id: index,
            title: title,
            link: link,
            contentHtml: description,
            pubDate: pubDate,
            author: 'Reddit'
          }
        })
      }
      
      console.log(`Parsed ${parsedPosts.length} posts from RSS/Atom feed`)
      if (parsedPosts.length > 0) {
        console.log('First post sample:', {
          title: parsedPosts[0].title,
          link: parsedPosts[0].link,
          contentPreview: parsedPosts[0].contentHtml.slice(0, 100) + '...'
        })
      }
      
      return parsedPosts
    } catch (error) {
      console.error('Error parsing RSS/Atom feed:', error)
      return []
    }
  }

  const handleFetchRss = async () => {
    if (!subreddit.trim()) {
      alert('Veuillez entrer un nom de subreddit')
      return
    }

    setLoading(true)
    setResult('')
    setRssData('')
    setPosts([])
    setCurrentPostIndex(0)

    try {
      const response = await window.api.fetchRss(subreddit.trim())
      
      if (response.success) {
        setResult(`RSS récupéré avec succès pour r/${subreddit}! ${response.data.length} caractères reçus.`)
        setRssData(response.data)
        
        // Parse RSS and extract posts
        const parsedPosts = parseRss(response.data)
        setPosts(parsedPosts)
        setCurrentPostIndex(0)
        
        console.log('RSS Data:', response.data.slice(0, 1000))
        console.log('Parsed posts:', parsedPosts.length)
      } else {
        setResult(`Erreur: ${response.error}`)
      }
    } catch (error) {
      setResult(`Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const nextPost = () => {
    if (currentPostIndex < posts.length - 1) {
      setCurrentPostIndex(currentPostIndex + 1)
    }
  }

  const previousPost = () => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '10px', boxSizing: 'border-box' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '10px' }}>
        <img alt="logo" className="logo" src={electronLogo} style={{ width: '50px', height: '50px' }} />
        <div className="creator">Reddit RSS Overlay</div>
      </div>
      
      {/* Reddit RSS Fetcher - Top Section */}
      <div className="reddit-section" style={{ 
        marginBottom: '10px', 
        padding: '15px', 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        backgroundColor: '#f5f5f5'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Reddit RSS Fetcher</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            placeholder="Nom du subreddit (ex: javascript)"
            style={{ 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              minWidth: '200px',
              flex: '1'
            }}
          />
          <button 
            onClick={handleFetchRss} 
            disabled={loading}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '4px', 
              border: 'none', 
              backgroundColor: '#007ACC', 
              color: 'black',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? 'Chargement...' : 'Récupérer RSS'}
          </button>
        </div>
        
        {/* Navigation Buttons */}
        {posts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={previousPost}
              disabled={currentPostIndex === 0}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: 'none', 
                backgroundColor: currentPostIndex === 0 ? '#ccc' : '#28a745', 
                color: 'black',
                cursor: currentPostIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Previous Post
            </button>
            <span style={{ fontSize: '14px', color: '#666' }}>
              {currentPostIndex + 1} / {posts.length}
            </span>
            <button 
              onClick={nextPost}
              disabled={currentPostIndex === posts.length - 1}
              style={{ 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: 'none', 
                backgroundColor: currentPostIndex === posts.length - 1 ? '#ccc' : '#28a745', 
                color: 'black',
                cursor: currentPostIndex === posts.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Next Post →
            </button>
          </div>
        )}
        
        {result && (
          <div style={{ 
            marginTop: '10px', 
            padding: '8px', 
            backgroundColor: result.includes('Erreur') ? '#ffebee' : '#e8f5e8',
            borderRadius: '4px',
            color: result.includes('Erreur') ? '#c62828' : '#2e7d32',
            fontSize: '14px'
          }}>
            {result}
          </div>
        )}
      </div>

      {/* Content Display Area - 90% of remaining height */}
      <div style={{ 
        flex: '1', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '15px',
        backgroundColor: '#fff',
        overflow: 'auto',
        minHeight: '0'
      }}>
        {posts.length > 0 ? (
          <div>
            <h2 style={{ 
              marginTop: '0', 
              marginBottom: '10px',
              borderBottom: '2px solid #007ACC',
              paddingBottom: '5px',
              color: '#007ACC',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text'
            }}>
              {posts[currentPostIndex].title}
            </h2>
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: '15px',
              borderLeft: '3px solid #007ACC',
              paddingLeft: '10px'
            }}>
              <strong>Author:</strong> {posts[currentPostIndex].author}<br/>
              <strong>Published:</strong> {posts[currentPostIndex].pubDate}<br/>
              <strong>Link:</strong> <a 
                href={posts[currentPostIndex].link} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#007ACC', textDecoration: 'none' }}
              >
                {posts[currentPostIndex].link}
              </a>
            </div>
            <div 
              style={{ 
                lineHeight: '1.6',
                fontSize: '14px',
                whiteSpace: 'pre-wrap',
                color: '#333',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                MozUserSelect: 'text',
                msUserSelect: 'text'
              }}
              dangerouslySetInnerHTML={{ 
                __html: posts[currentPostIndex].contentHtml
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&')
              }}
            />
          </div>
        ) : rssData ? (
          <div>
            <h3>Raw RSS Data:</h3>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '12px',
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              color: '#333',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text'
            }}>
              {rssData}
            </pre>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666',
            fontSize: '16px'
          }}>
            Enter a subreddit name and click "Récupérer RSS" to load content
          </div>
        )}
      </div>
    </div>
  )
}

export default App
