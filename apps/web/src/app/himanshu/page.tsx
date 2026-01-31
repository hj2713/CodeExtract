export default function HimanshuPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="max-w-2xl w-full mx-auto p-8">
				<div className="bg-white rounded-lg shadow-xl p-8">
					<h1 className="text-4xl font-bold text-gray-800 mb-4">
						Himanshu's Workspace
					</h1>
					<p className="text-gray-600 mb-6">
						This is your dedicated page to build features independently.
					</p>
					
					<div className="space-y-4">
						<div className="border-l-4 border-blue-500 pl-4 py-2">
							<h2 className="font-semibold text-lg">Getting Started</h2>
							<ul className="list-disc list-inside text-gray-700 mt-2">
								<li>This page is located at: <code className="bg-gray-100 px-2 py-1 rounded">/himanshu</code></li>
								<li>Edit this file: <code className="bg-gray-100 px-2 py-1 rounded">apps/web/src/app/himanshu/page.tsx</code></li>
								<li>Add your components and features here</li>
							</ul>
						</div>

						<div className="bg-blue-50 p-4 rounded-lg">
							<p className="text-sm text-gray-700">
								💡 <strong>Tip:</strong> Work on this page while your partner works on their page. 
								This prevents merge conflicts in Git!
							</p>
						</div>

						<div className="bg-green-50 p-4 rounded-lg border border-green-200">
							<p className="text-sm text-green-800">
								✅ <strong>SQLite Setup:</strong> No Docker needed! Database file is stored locally in the project.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
