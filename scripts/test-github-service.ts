import { GitHubService } from "../apps/web/src/lib/github/service";

async function test() {
  const owner = "mckaywrigley";
  const repo = "chatbot-ui";
  const branch = "main";

  console.log(`Testing GitHub Service for ${owner}/${repo} on branch ${branch}...`);

  try {
    const tree = await GitHubService.getRepoTree(owner, repo, branch);
    console.log("Success! Tree fetched.");
    console.log(`Total files: ${tree.length}`);
    console.log("Sample files:");
    tree.slice(0, 5).forEach(f => console.log(`- ${f.path} (${f.type})`));
  } catch (error) {
    console.error("Test Failed:");
    console.error(error);
  }
}

test();
