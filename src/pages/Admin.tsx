


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = 'abdulsist23@gmail.com';

function Admin() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState('dashboard');
	const [teams, setTeams] = useState([]);
	const [payments, setPayments] = useState([]);
	const [auditLogs, setAuditLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!user || user.email !== ADMIN_EMAIL) {
			navigate('/');
			return;
		}
		// Fetch all admin data
		const fetchData = async () => {
			setLoading(true);
			setError('');
			try {
				// Replace with actual API calls
				const teamsRes = await fetch('/api/admin/teams');
				const paymentsRes = await fetch('/api/admin/payments');
				const auditRes = await fetch('/api/admin/audit-logs');
				setTeams(await teamsRes.json());
				setPayments(await paymentsRes.json());
				setAuditLogs(await auditRes.json());
			} catch (e) {
				setError('Failed to load admin data.');
			}
			setLoading(false);
		};
		fetchData();
	}, [user, navigate]);

	if (!user || user.email !== ADMIN_EMAIL) {
		return null;
	}

	if (loading) {
		return <div className="p-8 text-center text-gray-400">Loading admin dashboard...</div>;
	}
	if (error) {
		return <div className="p-8 text-center text-red-400">{error}</div>;
	}

	return (
		<div className="max-w-7xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
			<div className="flex gap-4 mb-8">
				<button className={activeTab === 'dashboard' ? 'font-bold underline' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
				<button className={activeTab === 'payments' ? 'font-bold underline' : ''} onClick={() => setActiveTab('payments')}>Pending Payments</button>
				<button className={activeTab === 'audit' ? 'font-bold underline' : ''} onClick={() => setActiveTab('audit')}>Audit Log</button>
			</div>

			{activeTab === 'dashboard' && (
				<div>
					<h2 className="text-xl font-semibold mb-4">Teams</h2>
					<table className="w-full mb-8">
						<thead>
							<tr>
								<th>Team Name</th>
								<th>Event</th>
								<th>Phone</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{teams.map((team) => (
								<tr key={team.id}>
									<td>{team.team_name}</td>
									<td>{team.event_name}</td>
									<td>{team.phone_number}</td>
									<td>
										{/* Add delete, view, etc. */}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{activeTab === 'payments' && (
				<div>
					<h2 className="text-xl font-semibold mb-4">Pending Payments</h2>
					<table className="w-full mb-8">
						<thead>
							<tr>
								<th>Team</th>
								<th>Amount</th>
								<th>Status</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{payments.filter(p => p.status === 'PENDING' || p.status === 'WAITING').map((payment) => (
								<tr key={payment.id}>
									<td>{payment.team_name}</td>
									<td>{payment.amount}</td>
									<td>{payment.status}</td>
									<td>
										<button className="text-green-500 mr-2">Approve</button>
										<button className="text-red-500">Reject</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{activeTab === 'audit' && (
				<div>
					<h2 className="text-xl font-semibold mb-4">Audit Log</h2>
					<ul className="space-y-2">
						{auditLogs.map((log) => (
							<li key={log.id} className="border-b border-gray-700 pb-2">
								<div className="text-sm text-gray-300">{log.action} - {log.created_at}</div>
								<div className="text-xs text-gray-500">{log.details && JSON.stringify(log.details)}</div>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

export default Admin;
export { Admin };

