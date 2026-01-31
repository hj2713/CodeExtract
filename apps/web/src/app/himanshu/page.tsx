export default function HimanshuPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="mx-auto w-full max-w-2xl p-8">
				<div className="rounded-lg bg-white p-8 shadow-xl">
					<h1 className="mb-4 font-bold text-4xl text-gray-800">
						Himanshu's Workspace
					</h1>
					<p className="mb-6 text-gray-600">
						This is your dedicated page to build features independently.
					</p>

					<div className="space-y-4">
						<div className="border-blue-500 border-l-4 py-2 pl-4">
							<h2 className="font-semibold text-lg">Getting Started</h2>
							<ul className="mt-2 list-inside list-disc text-gray-700">
								<li>
									This page is located at:{" "}
									<code className="rounded bg-gray-100 px-2 py-1">
										/himanshu
									</code>
								</li>
								<li>
									Edit this file:{" "}
									<code className="rounded bg-gray-100 px-2 py-1">
										apps/web/src/app/himanshu/page.tsx
									</code>
								</li>
								<li>Add your components and features here</li>
							</ul>
						</div>

						<div className="rounded-lg bg-blue-50 p-4">
							<p className="text-gray-700 text-sm">
								💡 <strong>Tip:</strong> Work on this page while your partner
								works on their page. This prevents merge conflicts in Git!
							</p>
						</div>

						<div className="rounded-lg border border-green-200 bg-green-50 p-4">
							<p className="text-green-800 text-sm">
								✅ <strong>SQLite Setup:</strong> No Docker needed! Database
								file is stored locally in the project.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
