import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { githubService } from '../services/github';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const config = githubService.getConfig();
    if (config) {
      setToken(config.token);
      setOwner(config.owner);
      setRepo(config.repo);
    }
  }, []);

  const handleTest = async () => {
    if (!token || !owner || !repo) {
      setErrorMessage('请填写所有字段');
      setTestStatus('error');
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');
    setErrorMessage('');

    // 临时保存配置以进行测试
    const tempConfig = { token, owner, repo };
    githubService.saveConfig(tempConfig);

    try {
      const success = await githubService.testConnection();
      if (success) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setErrorMessage('连接失败。请检查 Token 和仓库信息是否正确。');
      }
    } catch (error) {
      setTestStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '连接测试失败');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!token || !owner || !repo) {
      setErrorMessage('请填写所有字段');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      githubService.saveConfig({ token, owner, repo });

      // 测试连接
      const success = await githubService.testConnection();
      if (success) {
        setTestStatus('success');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMessage('配置已保存，但连接测试失败。请检查配置是否正确。');
        setTestStatus('error');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '保存失败');
      setTestStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#999',
          }}
        >
          <X size={24} />
        </button>

        <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>GitHub 配置</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#ccc',
                fontSize: '0.9rem',
              }}
            >
              GitHub Token
            </label>
            <input
              type="password"
              className="input-primary"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#666' }}>
              需要 <code>repo</code> 权限。
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1b8dd4', marginLeft: '0.5rem' }}
              >
                创建 Token
              </a>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#ccc',
                fontSize: '0.9rem',
              }}
            >
              仓库所有者（用户名或组织名）
            </label>
            <input
              type="text"
              className="input-primary"
              placeholder="your-username"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#ccc',
                fontSize: '0.9rem',
              }}
            >
              仓库名称
            </label>
            <input
              type="text"
              className="input-primary"
              placeholder="game-queue"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: '100%' }}
            />
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '0.75rem',
                background: '#ff4444',
                color: 'white',
                borderRadius: '8px',
                fontSize: '0.9rem',
              }}
            >
              {errorMessage}
            </div>
          )}

          {testStatus === 'success' && (
            <div
              style={{
                padding: '0.75rem',
                background: '#28a745',
                color: 'white',
                borderRadius: '8px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle size={18} />
              连接成功！
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={handleTest}
              disabled={isTesting || !token || !owner || !repo}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: isTesting ? '#555' : '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '8px',
                cursor: isTesting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
              }}
            >
              {isTesting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  测试中...
                </>
              ) : testStatus === 'error' ? (
                <>
                  <XCircle size={18} />
                  重新测试
                </>
              ) : (
                '测试连接'
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !token || !owner || !repo}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: isSaving ? '#555' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={18} />
                  保存
                </>
              )}
            </button>
          </div>

          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#2a2a2a',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#999',
              lineHeight: '1.6',
            }}
          >
            <strong style={{ color: '#fff' }}>使用说明：</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <li>创建一个 GitHub Personal Access Token（需要 <code>repo</code> 权限）</li>
              <li>填写您的 GitHub 用户名和仓库名称</li>
              <li>点击"测试连接"验证配置是否正确</li>
              <li>配置保存在浏览器本地，不会上传到服务器</li>
              <li>所有游戏数据将保存到 GitHub 仓库的 <code>games.json</code> 文件</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
