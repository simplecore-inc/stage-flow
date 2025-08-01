import React from 'react';
import Layout from '@theme/Layout';
import styles from './landing.module.css';

export default function Home() {
  return (
    <Layout>
      <main className={styles.landingRoot}>
        <div className={styles.landingCard}>
          <h1 className={styles.title}>Stage Flow</h1>
          <p className={styles.subtitle}>A type-safe, plugin-based stage flow library for React applications</p>
          <a className={styles.cta} href="/stage-flow/docs/intro">Get Started</a>
        </div>
        <img 
          src="/img/simplecore-01.png" 
          alt="SimpleCORE Inc." 
          className={styles.logo}
        />
      </main>
    </Layout>
  );
} 