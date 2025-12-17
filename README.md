# CoinPawa - Next Gen Crypto Casino

CoinPawa is a modern crypto casino platform built with Next.js 14, TypeScript, and TailwindCSS. It features a responsive design, anonymous login, and crypto wallet management.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Wilson-Tapamo/CoinPawa.git
    cd CoinPawa
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 Testing the Application

To test the main flows of the application:

1.  **Landing Page**:
    -   Navigate to `http://localhost:3000`.
    -   Click **"Deposit"** or **"Withdraw"**. You should be redirected to the Wallet page (or Login if configured for strict auth).
    -   Click **"Claim Bonus"**. You should be directed to the Registration page.

2.  **Anonymous Login**:
    -   Go to the Login page (`/login`).
    -   Select the **"Anonymous"** tab.
    -   Click **"Start Playing Anonymously"**.
    -   Verify you are redirected to the **Wallet** (`/wallet`).

3.  **Wallet & Transfers**:
    -   Navigate to `/wallet`.
    -   Use the right-hand panel to switch between **Deposit** and **Withdraw**.
    -   **Deposit**: View the QR code and address.
    -   **Withdraw**: Fill in the Amount and Address fields and click "Confirm".

## 🤝 Contribution Guidelines

We follow a structured workflow for contributions to ensure code quality and stability.

### 1. Create an Issue
Before making changes, please check the [Issues](https://github.com/Wilson-Tapamo/CoinPawa/issues) page.
-   If you find a bug or want a new feature, **create a new Issue** describing it.
-   Assign the issue to yourself if you plan to work on it.

### 2. Create a Branch
Always create a new branch from `main` for your work. Use a descriptive name linking to the issue if possible.

```bash
# Update your local main
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feature/issue-id-short-description
# Example: git checkout -b feature/auth-flow-fix
```

### 3. Make Changes & Commit
Implement your changes. Keep commits small and descriptive.

```bash
git add .
git commit -m "feat: implement anonymous login redirection"
```

### 4. Push & Pull Request
Push your branch to the repository and create a Pull Request (PR) to merge into `main`.

```bash
git push origin feature/issue-id-short-description
```

-   Go to GitHub and open a **Pull Request**.
-   Describe your changes and link the Issue (e.g., "Closes #123").
-   Request a review.

## 🛠️ Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Styling**: TailwindCSS
-   **Icons**: Lucide React
-   **Language**: TypeScript

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
