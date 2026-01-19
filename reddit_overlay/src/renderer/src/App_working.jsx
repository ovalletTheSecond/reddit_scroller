import { useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

// Ajouter les styles pour l'animation
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.type = 'text/css'
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}

function App() {
  const [subreddit, setSubreddit] = useState('books')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [rssData, setRssData] = useState('')
  const [posts, setPosts] = useState([])
  const [currentPostIndex, setCurrentPostIndex] = useState(0)
  const [showWebView, setShowWebView] = useState(false)
  const [webViewUrl, setWebViewUrl] = useState('')
  const [autoWebView, setAutoWebView] = useState(false)
  const [fetchedContent, setFetchedContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [fullScreenMode, setFullScreenMode] = useState(false)

  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  // Vérifier que les APIs sont disponibles
  console.log('APIs available:', {
    electron: !!window.electron,
    api: !!window.api,
    fetchRss: !!window.api?.fetchRss,
    fetchRedditContent: !!window.api?.fetchRedditContent
  })

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
        
        console.log('🚀 CHECKING IF SHOULD FETCH - START')
        // Vérifier si le premier post contient un lien Reddit principal
        const currentPost = parsedPosts[0]
        console.log('🔍 Checking first post link:', currentPost.link)
        console.log('🔍 Is Reddit URL?', isRedditPostUrl(currentPost.link))
        
        if (isRedditPostUrl(currentPost.link)) {
          console.log('✅ CONDITION MET - SHOULD FETCH REDDIT CONTENT')
          console.log('🔗 Reddit post detected:', currentPost.link)
          fetchRedditContent(currentPost.link)
        } else {
          console.log('❌ CONDITION NOT MET - NO REDDIT FETCH')
          console.log('📄 Not a Reddit post, skipping auto-fetch')
        }
        console.log('🚀 CHECKING IF SHOULD FETCH - END')
      } else {
        console.log('⚠️ NO POSTS PARSED - NO FETCH CHECK')
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
      const newIndex = currentPostIndex + 1
      setCurrentPostIndex(newIndex)
      
      // Vérifier si le nouveau post a un lien Reddit principal
      if (posts[newIndex] && isRedditPostUrl(posts[newIndex].link)) {
        console.log('url main found - url fetched - response : fetching...', posts[newIndex].link)
        fetchRedditContent(posts[newIndex].link)
      } else {
        setAutoWebView(false)
        setFetchedContent('')
      }
    }
  }

  const previousPost = () => {
    if (currentPostIndex > 0) {
      const newIndex = currentPostIndex - 1
      setCurrentPostIndex(newIndex)
      
      // Vérifier si le nouveau post a un lien Reddit principal
      if (posts[newIndex] && isRedditPostUrl(posts[newIndex].link)) {
        console.log('url main found - url fetched - response : fetching...', posts[newIndex].link)
        fetchRedditContent(posts[newIndex].link)
      } else {
        setAutoWebView(false)
        setFetchedContent('')
      }
    }
  }

  // Fonction pour détecter les liens Reddit
  const isRedditPostUrl = (url) => {
    const isReddit = url && url.includes('reddit.com/r/') && url.includes('/comments/')
    console.log('🔍 URL check:', { url, isReddit })
    return isReddit
  }

  // Fonction pour ouvrir le webview avec un lien Reddit
  const openRedditPost = (url) => {
    setWebViewUrl(url)
    setShowWebView(true)
  }

  // Fonction pour fermer le webview
  const closeWebView = () => {
    setShowWebView(false)
    setWebViewUrl('')
  }

  // Fonctions pour le mode plein écran
  const enterFullScreenMode = () => {
    setFullScreenMode(true)
  }

  const exitFullScreenMode = () => {
    setFullScreenMode(false)
  }

  // Intercepter les clics sur les liens
  const handleLinkClick = (event) => {
    const target = event.target
    if (target.tagName === 'A') {
      const href = target.getAttribute('href')
      if (href && isRedditPostUrl(href)) {
        event.preventDefault()
        openRedditPost(href)
      }
    }
  }

  // Fonction pour fetch le contenu HTML d'une page Reddit
  const fetchRedditContent = async (url) => {
    console.log('🔗 Starting Reddit content fetch for:', url)
    setContentLoading(true)
    setAutoWebView(true)
    
    try {
      console.log('🔄 Calling main process to fetch Reddit content...')
      const response = await window.api.fetchRedditContent(url)
      console.log('📦 Response received from main process:', { success: response.success })
      
      if (response.success) {
        console.log('✅ Reddit content fetched successfully, length:', response.data.length)
        setFetchedContent(response.data)
      } else {
        console.error('❌ Error fetching Reddit content:', response.error)
        setFetchedContent('<div style="padding: 20px; text-align: center; color: #c62828;">Erreur lors du chargement du contenu Reddit: ' + response.error + '</div>')
      }
      
      setContentLoading(false)
    } catch (error) {
      console.error('❌ Exception while fetching Reddit content:', error)
      setFetchedContent('<div style="padding: 20px; text-align: center; color: #c62828;">Erreur lors du chargement du contenu Reddit: ' + error.message + '</div>')
      setContentLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      {fullScreenMode ? (
        // Mode plein écran
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Webview 80% de la hauteur */}
          <div style={{
            flex: '0.8',
            border: 'none',
            backgroundColor: '#fff',
            overflow: 'hidden',
            minHeight: '0'
          }}>
            {contentLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '18px',
                color: '#666',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '15px' }}>🔄 Loading Reddit content...</div>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid #f3f3f3',
                    borderTop: '5px solid #007ACC',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                </div>
              </div>
            ) : (
              <iframe
                srcDoc={fetchedContent}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="Reddit Post Content"
              />
            )}
          </div>
          
          {/* Contrôles de navigation 20% de la hauteur */}
          <div style={{
            flex: '0.2',
            backgroundColor: '#f8f9fa',
            borderTop: '2px solid #007ACC',
            padding: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '100px'
          }}>
            {/* Section gauche - Navigation des posts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={previousPost}
                disabled={currentPostIndex === 0}
                style={{
                  padding: '12px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: currentPostIndex === 0 ? '#ccc' : '#28a745',
                  color: 'white',
                  cursor: currentPostIndex === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ← Previous
              </button>
              
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#007ACC',
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {currentPostIndex + 1} / {posts.length}
              </div>
              
              <button 
                onClick={nextPost}
                disabled={currentPostIndex === posts.length - 1}
                style={{
                  padding: '12px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: currentPostIndex === posts.length - 1 ? '#ccc' : '#28a745',
                  color: 'white',
                  cursor: currentPostIndex === posts.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Next →
              </button>
            </div>
            
            {/* Section centre - Titre du post actuel */}
            <div style={{
              flex: '1',
              margin: '0 20px',
              textAlign: 'center'
            }}>
              {posts.length > 0 && (
                <div>
                  <h3 style={{
                    margin: '0 0 5px 0',
                    fontSize: '16px',
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {posts[currentPostIndex]?.title || 'No title'}
                  </h3>
                  <div style={{
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    r/{subreddit} • {posts[currentPostIndex]?.author || 'Unknown'}
                  </div>
                </div>
              )}
            </div>
            
            {/* Section droite - Contrôles subreddit et mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  value={subreddit}
                  onChange={(e) => setSubreddit(e.target.value)}
                  placeholder="Subreddit"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    width: '120px',
                    fontSize: '14px'
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
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    fontSize: '14px'
                  }}
                >
                  {loading ? '...' : 'Load'}
                </button>
              </div>
              
              <button 
                onClick={exitFullScreenMode}
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '2px solid #dc3545',
                  backgroundColor: 'white',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Exit Fullscreen
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Mode normal
        <div style={{ display: 'flex', height: '100%', padding: '10px', gap: '10px' }}>
          {/* Control Panel */}
          <div style={{
            flexShrink: 0,
            width: '300px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            backgroundColor: '#fff',
            height: 'fit-content'
          }}>
            <h1 style={{
              margin: '0 0 15px 0',
              color: '#007ACC',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              Reddit RSS Reader
            </h1>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                color: '#333',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Subreddit:
              </label>
              <input
                type="text"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                placeholder="e.g., javascript"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #007ACC',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}
              />
              <button
                onClick={handleFetchRss}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: loading ? '#ccc' : '#007ACC',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
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
                {autoWebView && (
                  <button
                    onClick={() => setFullScreenMode(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007ACC',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginLeft: '5px'
                    }}
                  >
                    🔍 Fullscreen
                  </button>
                )}
                <button
                  onClick={() => setAutoWebView(false)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: '5px'
                  }}
                >
                  📄 Vanilla RSS
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

          {/* Content Display Area */}
          <div style={{ 
            flex: autoWebView ? '0.6' : '1', 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            backgroundColor: '#fff',
            overflow: 'auto',
            minHeight: '0',
            marginBottom: autoWebView ? '10px' : '0'
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
                  onClick={handleLinkClick}
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
          
          {/* Auto WebView en bas pour les posts Reddit */}
          {autoWebView && (
            <div style={{
              flex: '0.4',
              border: '1px solid #007ACC',
              borderRadius: '8px',
              backgroundColor: '#fff',
              overflow: 'hidden',
              minHeight: '200px'
            }}>
              {/* Pas de header - contenu direct */}
              
              {/* Contenu du webview */}
              <div style={{
                height: '100%',
                overflow: 'auto',
                position: 'relative'
              }}>
                {contentLoading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    fontSize: '16px',
                    color: '#666'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '10px' }}>🔄 Loading Reddit content...</div>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #007ACC',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto'
                      }}></div>
                    </div>
                  </div>
                ) : (
                  <iframe
                    srcDoc={fetchedContent}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    title="Reddit Post Content"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          zIndex: 1000
        }}>
          {/* Header avec bouton de retour */}
          <div style={{
            height: '50px',
            backgroundColor: '#007ACC',
            display: 'flex',
            alignItems: 'center',
            padding: '0 15px',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ color: 'white', margin: 0 }}>Reddit Post</h3>
            <button 
              onClick={closeWebView}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#007ACC',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ← Back to RSS
            </button>
          </div>
          
          {/* WebView */}
          <webview 
            src={webViewUrl}
            style={{
              width: '100%',
              height: 'calc(100% - 50px)',
              border: 'none'
            }}
          />
        </div>
      )}
      
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
            {autoWebView && (
              <button
                onClick={() => setFullScreenMode(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007ACC',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: '5px'
                }}
              >
                🔍 Fullscreen
              </button>
            )}
            <button
              onClick={() => setAutoWebView(false)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '5px'
              }}
            >
              📄 Vanilla RSS
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

      {/* Content Display Area - Ajusté pour faire place au webview */}
      <div style={{ 
        flex: autoWebView ? '0.6' : '1', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '15px',
        backgroundColor: '#fff',
        overflow: 'auto',
        minHeight: '0',
        marginBottom: autoWebView ? '10px' : '0'
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
              onClick={handleLinkClick}
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
      
      {/* Auto WebView en bas pour les posts Reddit */}
      {autoWebView && (
        <div style={{
          flex: '0.4',
          border: '1px solid #007ACC',
          borderRadius: '8px',
          backgroundColor: '#fff',
          overflow: 'hidden',
          minHeight: '200px'
        }}>
          {/* Pas de header - contenu direct */}
          
          {/* Contenu du webview */}
          <div style={{
            height: '100%',
            overflow: 'auto',
            position: 'relative'
          }}>
            {contentLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '16px',
                color: '#666'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '10px' }}>🔄 Loading Reddit content...</div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #007ACC',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                </div>
              </div>
            ) : (
              <iframe
                srcDoc={fetchedContent}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="Reddit Post Content"
              />
            )}
          </div>
        </div>
      )}
    </div>

      {/* Fullscreen Mode */}
      {fullScreenMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f5f5f5',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Webview - 80% of height (no header) */}
          <div style={{
            height: '80vh',
            border: '1px solid #007ACC',
            backgroundColor: '#fff',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Exit button - floating */}
            <button
              onClick={() => setFullScreenMode(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 122, 204, 0.9)',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: 1000,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              ✕ Exit
            </button>
            {/* Contenu du webview - full height */}
            <div style={{
              height: '100%',
              overflow: 'auto',
              position: 'relative'
            }}>
              {contentLoading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  fontSize: '18px',
                  color: '#666'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '15px' }}>🔄 Loading Reddit content...</div>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      border: '5px solid #f3f3f3',
                      borderTop: '5px solid #007ACC',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto'
                    }}></div>
                  </div>
                </div>
              ) : (
                <iframe
                  srcDoc={fetchedContent}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title="Reddit Post Content - Fullscreen"
                />
              )}
            </div>
          </div>

          {/* Navigation Controls - 20% of height */}
          <div style={{
            height: '20vh',
            backgroundColor: '#fff',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderTop: '2px solid #007ACC'
          }}>
            {/* Subreddit selector */}
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '16px', fontWeight: 'bold' }}>Subreddit:</label>
              <input
                type="text"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value)}
                placeholder="Enter subreddit name"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '2px solid #007ACC',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              <button
                onClick={handleFetchRss}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: loading ? '#ccc' : '#007ACC',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Loading...' : 'Load RSS'}
              </button>
            </div>

            {/* Post navigation */}
            {posts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button
                  onClick={goToPrevious}
                  disabled={currentPostIndex === 0}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: currentPostIndex === 0 ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPostIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    flex: '1'
                  }}
                >
                  ← Previous Post
                </button>

                <div style={{ 
                  textAlign: 'center',
                  minWidth: '120px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#007ACC'
                }}>
                  {currentPostIndex + 1} / {posts.length}
                </div>

                <button
                  onClick={goToNext}
                  disabled={currentPostIndex >= posts.length - 1}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: currentPostIndex >= posts.length - 1 ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPostIndex >= posts.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    flex: '1'
                  }}
                >
                  Next Post →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
