import { useEffect, useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const API = import.meta.env.VITE_API_URL || "https://bombastic-nanci-shadowed.ngrok-free.dev";

// --- Icons (Inline SVGs for no dependencies) ---
const IconDashboard = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconFile = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;
const IconCloud = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c3.037 0 5.5-2.463 5.5-5.5 0-2.798-2.083-5.064-4.756-5.418C17.135 4.314 13.882 2 10 2 6.4 2 3.328 4.256 2.244 7.422c-2.43.432-4.244 2.56-4.244 5.078 0 2.872 2.328 5.2 5.2 5.2H17.5z"></path><path d="M12 12v6"></path><path d="M9 15l3-3 3 3"></path></svg>;
const IconTrash = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const IconDownload = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconBell = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const IconMore = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>;

const IconImage  = () => <svg viewBox="0 0 24 24" style={{color:"#4f46e5"}} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="M21 15l-5-5L5 21"/></svg>;
const IconAudio = () => <svg viewBox="0 0 24 24" style={{color:"#ec4899"}} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19 5a9 9 0 010 14"/></svg>;
const IconVideo = () => <svg viewBox="0 0 24 24" style={{color:"#ef4444"}} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="15" height="14" rx="2"/><polygon points="16 7 22 12 16 17"/></svg>;
const IconDocument = () => <svg viewBox="0 0 24 24" style={{color:"#10b981"}} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;

const IconUser = () => (
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
<circle cx="12" cy="7" r="4"/>
</svg>
);

const getFileType = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();

  if (["mp3"].includes(ext)) return "audio";
  if (["mp4"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png"].includes(ext)) return "image";
  if (["pdf", "doc", "docx"].includes(ext)) return "document";

  return "other";
};

function App() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [user, setUser] = useState(null);
  const [googleToken, setGoogleToken] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [fileCategory, setFileCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [profile, setProfile] = useState({
  name: "",
  phone: "",
  age: ""
});

const filteredFiles = files.filter((f) => {
  const matchesCategory = fileCategory
    ? getFileType(f.filename) === fileCategory
    : true;

  return matchesCategory;
});

const searchResults = files.filter((f) =>
  f.filename.toLowerCase().includes(searchQuery.toLowerCase())
);

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/files/`, {
        headers: {
          token: googleToken,
          "ngrok-skip-browser-warning": "true",
        },
      });
      setFiles(res.data);
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.response) {
        console.log("Fetch error details:", error.response.data);
      }
    }
  };

  // Run once on load
  useEffect(() => {
    if (googleToken) {
      fetchFiles();
    }
  }, [googleToken]);

  useEffect(()=>{
  const savedProfile = localStorage.getItem("profile");
  if(savedProfile){
    setProfile(JSON.parse(savedProfile));
  }
},[]);

  // Upload file
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Check if backend is alive and has auth disabled
      const statusRes = await axios.get(`${API}/`, { headers: { "ngrok-skip-browser-warning": "true" } });
      console.log("Backend status:", statusRes.data.message);

      setUploadProgress(1);
      console.log('Sending upload request with token length:', googleToken?.length);

      const res = await axios.post(`${API}/upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "token": googleToken, // Using the token that the CURRENTLY RUNNING (old) backend requires
          "ngrok-skip-browser-warning": "true"
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });

      setMessage(`Uploaded successfully! Version ${res.data.version}`);
      setFile(null);
      setTimeout(() => setUploadProgress(0), 1000);
      fetchFiles();
    } catch (error) {
      console.error("Upload error:", error);
      if (error.response) {
        console.log("Upload error details:", error.response.data);
        const errorDetail = error.response?.data?.detail;
        const displayMsg = typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : (errorDetail || error.message);
        setMessage(`Upload failed: ${displayMsg}`);
      } else {
        setMessage(`Upload failed: ${error.message}`);
      }
      setUploadProgress(0);
    }
  };

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".search-container")) {
      setShowSearch(false);
    }
  };

  document.addEventListener("click", handleClickOutside);

  return () => {
    document.removeEventListener("click", handleClickOutside);
  };
}, []);

  // Download file
  const downloadFile = async (id, filename) => {
    try {
      setDownloadingId(id);
      setDownloadProgress(0);

      const response = await axios.get(`${API}/download/${id}`, {
        responseType: "blob",
        headers: {
          token: googleToken,
          "ngrok-skip-browser-warning": "true"
        },
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setDownloadProgress(percent);
          } else {
            setDownloadProgress(50);
          }
        },
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
      setDownloadingId(null);
      setDownloadProgress(0);
    } catch (error) {
      console.error("Download error:", error);
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  // Delete file
  const deleteFile = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await axios.delete(`${API}/delete/${id}`, {
        headers: {
          token: googleToken,
          "ngrok-skip-browser-warning": "true"
        }
      });
      setMessage("File deleted successfully.");
      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Delete failed.");
    }
  };

  // ---------------- OPEN IN ONLYOFFICE ----------------
  const openEditor = (fileId, filename) => {

  const config = {
    document: {
      fileType: filename.split(".").pop(),
      key: `${fileId}-${Date.now()}`,
      title: filename,
      url: `${API}/editor/file/${fileId}`
    },

    editorConfig: {
      mode: "edit",
      callbackUrl: `${API}/editor/save/${fileId}`
    }
  };

  localStorage.setItem("onlyofficeConfig", JSON.stringify(config));

  window.open(`${window.location.origin}/editor.html`, "_blank");
};

  const storageUsed = 75;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (storageUsed / 100) * circumference;

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '32px' }}>
            <IconCloud />
            <span>LockedIn</span>
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Login to access your distributed file storage</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                const decoded = jwtDecode(credentialResponse.credential);
                setUser(decoded);
                setGoogleToken(credentialResponse.credential);
              }}
              onError={() => console.log("Login Failed")}
            />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Secure and decentralized storage</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <IconCloud />
          <span>LockedIn</span>
        </div>
        <nav className="nav-menu">
  <div
    className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
    onClick={() => {
  setSelectedFile(null);
setActivePage("dashboard");
  setSearchQuery("");
  setShowSearch(false);
}}
  >
    <IconDashboard />
    <span>Dashboard</span>
  </div>

  <div
    className={`nav-item ${activePage === "files" ? "active" : ""}`}
onClick={() => {
  setFileCategory(null);
  setSelectedFile(null);
  setActivePage("files");
}}
  >
    <IconFile />
    <span>My Files</span>
  </div>

  <div
    className={`nav-item ${activePage === "recent" ? "active" : ""}`}
    onClick={() => {
  setActivePage("recent");
  setSearchQuery("");
  setShowSearch(false);
}}
  >
    <IconFile />
    <span>Recent Files</span>
  </div>

  <div
    className={`nav-item ${activePage === "storage" ? "active" : ""}`}
    onClick={() => setActivePage("storage")}
  >
    <IconCloud />
    <span>Storage</span>
  </div>
  <div
  className={`nav-item ${activePage === "profile" ? "active" : ""}`}
  onClick={() => setActivePage("profile")}
>
  <IconUser />
  <span>Profile</span>
</div>
</nav>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {user.name ? user.name.charAt(0) : user.email.charAt(0)}
            </div>
            <div className="profile-info">
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name || "User"}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
          <h1>
  {activePage === "dashboard" && "Dashboard"}
  {activePage === "recent" && "Recent Files"}
  {activePage === "files" && "My Files"}
  {activePage === "storage" && "Storage"}
  {activePage === "profile" && "Profile"}
</h1>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="search-container" style={{ position: "relative" }}>
  <span className="search-icon"><IconSearch /></span>

  <input
    type="text"
    className="search-input"
    placeholder="Search files..."
    value={searchQuery}
    onChange={(e) => {
  setSearchQuery(e.target.value);
  setShowSearch(true);
}}
  />

  {showSearch && searchQuery && (
    <div className="search-dropdown">

      {searchResults.length === 0 ? (
        <div className="search-item">No files found</div>
      ) : (
        searchResults.map((f) => (
          <div
            key={f.id}
            className="search-item"
           onClick={() => {
  setSelectedFile(f.id);
  setActivePage("files");
  setSearchQuery("");
  setShowSearch(false);
}}
          >
            {f.filename}
          </div>
        ))
      )}

    </div>
  )}
</div>
            <button className="btn btn-ghost btn-icon"><IconBell /></button>
          </div>
        </header>

        {activePage === "dashboard" && (
<div className="dashboard-grid">
          <div className="left-column">
            <div className="card" style={{ marginBottom: '15px' }}>
              <div className="card-title">Upload New File</div>
              <div className="upload-zone" onClick={() => document.getElementById('file-input').click()}>
                <div className="upload-icon" style={{ margin: '0 auto 16px' }}><IconCloud /></div>
                <div style={{ fontWeight: 600 }}>Click to select or drag and drop</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {file ? `Selected: ${file.name}` : "Any file type supported"}
                </div>
                <input id="file-input" type="file" hidden onChange={(e) => setFile(e.target.files[0])} />
              </div>

              {file && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button className="btn btn-primary" onClick={handleUpload} disabled={uploadProgress > 0}>
                    {uploadProgress > 0 ? "Uploading..." : "Start Upload"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setFile(null)}>Cancel</button>
                </div>
              )}

              {uploadProgress > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}
              {message && <p style={{ marginTop: '12px', fontSize: '0.875rem', color: message.includes('success') ? 'var(--success)' : 'var(--danger)' }}>{message}</p>}
            </div>

            <div className="category-grid">
      <div
      className="category-card"
      onClick={() => {
        setSelectedFile(null);
setFileCategory("image");
setActivePage("files");
      }}
    >
      <IconImage />
      <span>Image</span>
    </div>

  <div
  className="category-card"
 onClick={() => {
  setSelectedFile(null);
  setFileCategory("audio");
  setActivePage("files");
}}
>
  <IconAudio />
  <span>Audio</span>
</div>

  <div
  className="category-card"
onClick={() => {
  setSelectedFile(null);
  setFileCategory("video");
  setActivePage("files");
}}
>
  <IconVideo />
  <span>Video</span>
</div>

<div
  className="category-card"
onClick={() => {
  setSelectedFile(null);
  setFileCategory("document");
  setActivePage("files");
}}
>
  <IconDocument />
  <span>Document</span>
</div>
</div>
</div>

          <div className="right-column">
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-title">Storage Details</div>
              <div className="storage-circle">
                <svg width="120" height="120">
                  <circle className="circle-bg" cx="60" cy="60" r="54" />
                  <circle className="circle-fill" cx="60" cy="60" r="54" style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{storageUsed}%</div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>USED</div>
                </div>
              </div>
              <div className="storage-info">
                <div className="storage-used">750 MB</div>
                <div className="storage-total">of 1 GB used</div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}>Upgrade Plan</button>
            </div>

            <div className="card" style={{ marginTop: '24px' }}>
              <div className="card-title">Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginTop: '6px' }}></div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {i === 1 ? 'New file uploaded' : i === 2 ? 'Document shared' : 'Maintenance completed'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{i} hour ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
{activePage === "recent" && (
  <div className="dashboard-grid">
    <div className="left-column">
      <div className="card">

        <div className="card-title">
          Recent Files
          <button className="btn btn-ghost btn-icon">
            <IconMore />
          </button>
        </div>

        {files.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No files uploaded yet.
          </div>
        )}

        {files.length > 0 && (
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {files.slice().reverse().map((f) => (
                <tr key={f.id} className="file-row">

                  <td>
                    <div className="file-name-cell">
                      <div className="file-icon">
                        <IconFile />
                      </div>

                      <div>
                        <div style={{ fontWeight: 500 }}>{f.filename}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {f.uploaded_at || "Recently"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="badge">v{f.version}</span>
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>

                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => openEditor(f.id, f.filename)}
                      >
                        ✏️
                      </button>

                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => downloadFile(f.id, f.filename)}
                      >
                        <IconDownload />
                      </button>

                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ color: "var(--danger)" }}
                        onClick={() => deleteFile(f.id)}
                      >
                        <IconTrash />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}

      </div>
    </div>
  </div>
)}
{activePage === "files" && (
  <div className="dashboard-grid">
    <div className="left-column">
      <div className="card">

        <div className="card-title">
          All Files
          <button className="btn btn-ghost btn-icon">
            <IconMore />
          </button>
        </div>

        {files.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No files uploaded yet.
          </div>
        )}

        {files.length > 0 && (
          <table className="file-table">

            <thead>
              <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredFiles
                .filter((f) => !selectedFile || f.id === selectedFile)
                .map((f) => (

                <tr key={f.id} className="file-row">

                  <td>
                    <div className="file-name-cell">
                      <div className="file-icon">
                        <IconFile />
                      </div>

                      <div>
                        <div style={{ fontWeight: 500 }}>{f.filename}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {f.uploaded_at || "Recently"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="badge">v{f.version}</span>
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>

                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => openEditor(f.id, f.filename)}
                      >
                        ✏️
                      </button>

                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => downloadFile(f.id, f.filename)}
                      >
                        <IconDownload />
                      </button>

                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ color: "var(--danger)" }}
                        onClick={() => deleteFile(f.id)}
                      >
                        <IconTrash />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}

      </div>
    </div>
  </div>
)}
{activePage === "profile" && (
  <div className="dashboard-grid">
    <div className="left-column">
      <div className="card">

        <div className="card-title">Profile</div>

        <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>

          <input
            className="search-input"
            placeholder="Full Name"
            value={profile.name}
            onChange={(e)=>setProfile({...profile, name:e.target.value})}
          />

          <input
  type="tel"
  className="search-input"
  placeholder="Phone Number"
            value={profile.phone}
            onChange={(e)=>setProfile({...profile, phone:e.target.value})}
          />

          <input
          
  type="number"
  className="search-input"
  placeholder="Age"
            value={profile.age}
            onChange={(e)=>setProfile({...profile, age:e.target.value})}
          />

          <button
            className="btn btn-primary"
            onClick={()=>{
              localStorage.setItem("profile", JSON.stringify(profile));
              alert("Profile saved");
            }}
          >
            Save
          </button>

        </div>

      </div>
    </div>
  </div>
)}

</main>
</div>
);
}

export default App;