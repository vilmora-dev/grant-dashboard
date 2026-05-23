<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 — Page Not Found</title>

    <!-- Fonts (same stack as the main app) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@400;600;700&display=swap">

    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body { height: 100%; }

        body {
            font-family: 'IBM Plex Sans', system-ui, sans-serif;
            background-color: #C8EFE2;
            color: #233B22;
            -webkit-font-smoothing: antialiased;
            display: flex;
            flex-direction: column;
        }

        /* Header */
        header {
            position: sticky;
            top: 0;
            z-index: 50;
            background: #C8EFE2;
            border-bottom: 1px solid #000;
            padding: 0.75rem 2rem;
        }
        header a {
            display: inline-flex;
            align-items: center;
            text-decoration: none;
        }
        header img {
            height: 2.5rem;
            width: auto;
        }

        /* Main */
        main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4rem 1.5rem;
        }

        .content {
            max-width: 32rem;
            width: 100%;
        }

        /* Status badge */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(0, 104, 37, 0.10);
            border: 1px solid rgba(0, 104, 37, 0.20);
            border-radius: 9999px;
            padding: 0.25rem 0.75rem;
            margin-bottom: 1.5rem;
        }
        .badge-dot {
            width: 0.375rem;
            height: 0.375rem;
            border-radius: 9999px;
            background: #006825;
            flex-shrink: 0;
        }
        .badge-text {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.625rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #006825;
        }

        /* Headline */
        h1 {
            font-family: 'IBM Plex Serif', serif;
            font-weight: 700;
            font-size: clamp(2rem, 5vw, 2.75rem);
            line-height: 1.15;
            color: #233B22;
            margin-bottom: 1rem;
        }

        /* Body copy */
        p {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 0.9375rem;
            color: #5D5961;
            line-height: 1.65;
            max-width: 26rem;
            margin-bottom: 2.5rem;
        }

        /* Buttons */
        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
        }

        .btn-primary {
            display: inline-block;
            background: #006825;
            color: #fff;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 0.8125rem;
            font-weight: 500;
            text-decoration: none;
            border: none;
            border-radius: 0.5rem;
            padding: 0.625rem 1.25rem;
            cursor: pointer;
            transition: background 0.15s;
        }
        .btn-primary:hover { background: #005a1f; }

        .btn-secondary {
            display: inline-block;
            background: rgba(255,255,255,0.6);
            color: #5D5961;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 0.8125rem;
            text-decoration: none;
            border: 1px solid #C2E8DB;
            border-radius: 0.5rem;
            padding: 0.625rem 1.25rem;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .btn-secondary:hover {
            background: #fff;
            border-color: rgba(0,104,37,0.30);
            color: #233B22;
        }

        /* Footer */
        footer {
            border-top: 1px solid #C2E8DB;
            padding: 1.5rem;
            text-align: center;
        }
        footer span {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 0.6875rem;
            font-weight: 500;
            color: #006825;
        }
    </style>
</head>
<body>

    <header>
        <a href="/">
            <img src="/delta-logo.webp" alt="Delta Rising Foundation">
        </a>
    </header>

    <main>
        <div class="content">

            <div class="badge">
                <span class="badge-dot"></span>
                <span class="badge-text">Error 404</span>
            </div>

            <h1>Page not found.</h1>

            <p>This page doesn't exist or may have been moved. If you typed the address, double-check for typos.</p>

            <div class="actions">
                <a href="/" class="btn-primary">Go to Home</a>
                <button class="btn-secondary" onclick="history.length > 1 ? history.back() : window.location.href = '/'">
                    ← Go back
                </button>
            </div>

        </div>
    </main>

    <footer>
        <span>Delta Rising Foundation · Grants Platform</span>
    </footer>

</body>
</html>
