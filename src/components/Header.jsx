import React from 'react';

// Importações de logos e ícones
import adaLogoMain from '../assets/imgs/Ada Lovelace.png';
import adaLogoIco from '../assets/imgs/Ada Lovelace.ico';

/**
 * Componente Header
 * 
 * Cabeçalho principal do Censo CEEP com:
 * - Logo e título da aplicação (Ada Lovelace)
 * - Navegação principal
 * - Informações de contexto
 * - Links de usuário/perfil (opcional)
 * 
 * @component
 * @returns {JSX.Element} Header da aplicação
 */
export const Header = () => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
      role="banner"
    >
      {/* ===== SEÇÃO ESQUERDA: LOGO E TÍTULO ===== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flex: 1
        }}
      >
        {/* Logo Ada Lovelace */}
        <img
          src={adaLogoMain}
          alt="Logo Ada Lovelace - Censo CEEP"
          style={{
            height: '42px',
            width: 'auto',
            objectFit: 'contain',
            flexShrink: 0
          }}
        />

        {/* Divisor Visual */}
        <div
          style={{
            width: '1px',
            height: '28px',
            backgroundColor: '#e2e8f0'
          }}
        />

        {/* Título e Subtítulo */}
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '-0.5px'
            }}
          >
            Censo CEEP
          </h1>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '12px',
              color: '#64748b',
              fontWeight: '500'
            }}
          >
            Pesquisa Participativa de Equidade Étnico-Racial
          </p>
        </div>
      </div>

      {/* ===== SEÇÃO CENTRAL: NAVEGAÇÃO (OPCIONAL) ===== */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flex: 1,
          justifyContent: 'center'
        }}
        aria-label="Navegação principal"
      >
        <a
          href="#dashboard"
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#475569',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.target.style.color = '#2563eb'}
          onMouseLeave={(e) => e.target.style.color = '#475569'}
        >
          Dashboard
        </a>
        <a
          href="#entrevistas"
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#475569',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.target.style.color = '#2563eb'}
          onMouseLeave={(e) => e.target.style.color = '#475569'}
        >
          Entrevistas
        </a>
        <a
          href="#relatorios"
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#475569',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.target.style.color = '#2563eb'}
          onMouseLeave={(e) => e.target.style.color = '#475569'}
        >
          Relatórios
        </a>
        <a
          href="#configuracoes"
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#475569',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.target.style.color = '#2563eb'}
          onMouseLeave={(e) => e.target.style.color = '#475569'}
        >
          Configurações
        </a>
      </nav>

      {/* ===== SEÇÃO DIREITA: ÍCONE + MENU USUÁRIO ===== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flex: 1,
          justifyContent: 'flex-end'
        }}
      >
        {/* Ícone Ada Lovelace */}
        <img
          src={adaLogoIco}
          alt="Ícone Ada Lovelace"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            objectFit: 'contain',
            flexShrink: 0
          }}
          title="Ada Lovelace - Inspiração desta aplicação"
        />

        {/* Botão de Status / Contexto */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#475569',
            fontWeight: '500'
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              animation: 'pulse 2s infinite'
            }}
          />
          Ativo
        </div>

        {/* Menu de Usuário (Dropdown) */}
        <div
          style={{
            position: 'relative'
          }}
        >
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="Menu do usuário"
            aria-expanded={userMenuOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <span>👤</span>
            <span>Usuário</span>
            <span style={{
              transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>
              ▼
            </span>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                minWidth: '180px',
                zIndex: 1001,
                overflow: 'hidden',
                animation: 'slideDown 0.2s ease-out'
              }}
            >
              <a
                href="#perfil"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: '#475569',
                  textDecoration: 'none',
                  fontSize: '13px',
                  transition: 'background-color 0.2s ease',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                📋 Meu Perfil
              </a>
              <a
                href="#notificacoes"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: '#475569',
                  textDecoration: 'none',
                  fontSize: '13px',
                  transition: 'background-color 0.2s ease',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                🔔 Notificações
              </a>
              <a
                href="#ajuda"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: '#475569',
                  textDecoration: 'none',
                  fontSize: '13px',
                  transition: 'background-color 0.2s ease',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ❓ Ajuda
              </a>
              <button
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  color: '#ef4444',
                  textDecoration: 'none',
                  fontSize: '13px',
                  transition: 'background-color 0.2s ease',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={() => {
                  console.log('Logout');
                  setUserMenuOpen(false);
                }}
              >
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== ESTILOS GLOBAIS ===== */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
};

export default Header;