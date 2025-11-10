'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.scss';
import Logo from '../../../public/imperial-archive-logo.svg';

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to home page
        router.push('/');
        router.refresh();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Logo />
          <h1 className={styles.title}>
            🔒 Site Access Required
          </h1>
          <p className={styles.subtitle}>
            This site is currently in development. Enter the password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={styles.input}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Verifying...' : 'Enter Site'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Access will be remembered for 30 days</p>
        </div>
      </div>
    </div>
  );
}