import { useEffect } from 'react';
import { useBeforeUnload, useLocation, useNavigate } from 'react-router-dom';

function NavigationPrompt({ when, message }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Protege contra fechamento/reload da aba
  useBeforeUnload(
    (event) => {
      if (when) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
    [when]
  );

  useEffect(() => {
    const handlePopState = () => {
      if (when && !window.confirm(message)) {
        navigate(location.pathname); // Cancela navegação
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [when, message, location, navigate]);

  return null;
}

export default NavigationPrompt;
