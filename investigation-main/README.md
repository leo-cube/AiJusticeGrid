# Police Investigation System

A comprehensive web application for police investigations, financial fraud detection, and exchange matching. This system provides a user-friendly interface for law enforcement officers to manage investigations, track financial fraud cases, analyze exchange mismatches, and generate reports.

## Augment AI Integration

This system features Augment AI integration, providing specialized AI agents for different crime types:

- **Murder Agent**: Powered by NVIDIA's Llama-3.1-Nemotron-Ultra-253B model for homicide investigations
- **Theft Agent**: Specialized in property crime analysis
- **Financial Fraud Agent**: Expert in detecting financial crimes and patterns
- **General Agent**: Provides overall assistance for all investigation types

## Features

- **Authentication**: Secure login system for authorized personnel
- **Dashboard**: Overview of active investigations, recent crimes, and key statistics
- **Crime Section**: Map and list views of crime data with detailed information
- **Finance Fraud**: Tools for investigating financial fraud cases and stock manipulation
- **Exchange Matching**: Detection and analysis of suspicious exchange patterns
- **Reports**: Generation and management of investigation reports
- **Chat Assistant**: AI-powered assistant to help with investigations
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **Frontend**: Next.js, React, Tailwind CSS
- **Authentication**: NextAuth.js
- **Icons**: Heroicons
- **Charts**: Chart.js
- **Maps**: Leaflet

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Git and Large Files

This repository contains some large files, particularly in the `Agent/murder datasets/` directory. Files over 100MB are excluded from Git tracking to comply with GitHub's file size limits.

### Excluded Large Files

The following files are excluded from Git:

- `Agent/murder datasets/Crime_Data_from_2020_to_Present (1).csv` (208MB)
- `Agent/murder datasets/database.csv` (111MB)

### Using Git LFS

For tracking large files, this repository is configured to use Git Large File Storage (LFS). To work with these files:

1. Install Git LFS: https://git-lfs.github.com/
2. Initialize Git LFS: `git lfs install`
3. Clone the repository: `git clone https://github.com/your-username/investigation.git`
4. Pull LFS files: `git lfs pull`

### Sample Data

For development purposes, sample data files are included in the repository:

- `Agent/murder datasets/sample_murder_data.csv`
- `Agent/murder datasets/sample_murder_data.json`

You can generate these sample files using the script at `Agent/scripts/generate_sample_data.py`.
