import React from 'react';
import ForgeReconciler, { Text, Inline, useProductContext, ProgressBar } from '@forge/react';
import { requestJira } from '@forge/bridge';

const fetchImplementsLinks = async (issueIdOrKey) => {
  if (!issueIdOrKey) return null;

  const res = await requestJira(`/rest/api/3/issue/${issueIdOrKey}`);
  const data = await res.json();

  const implementsLinks = data.fields.issuelinks?.filter(link => 
    link.type.name === 'Implements' && link.outwardIssue
  ) || [];

  const statusPromises = implementsLinks.map(async (link) => {
    const statusRes = await requestJira(`/rest/api/3/issue/${link.outwardIssue.key}`);
    const statusData = await statusRes.json();
    return statusData.fields.status.statusCategory.key === 'done';
  });

  const statuses = await Promise.all(statusPromises);
  const completedCount = statuses.filter(Boolean).length;

  return {
    total: implementsLinks.length,
    completed: completedCount,
    progress: implementsLinks.length ? (completedCount / implementsLinks.length) * 100 : 0
  };
};


const App = () => {
  const context = useProductContext();
  const [implementsData, setImplementsData] = React.useState();

  React.useEffect(() => {
    if (context) {
      const issueId = context.extension.issue.id;
      fetchImplementsLinks(issueId)
        .then(setImplementsData)
        .catch(error => {
          console.error('Error fetching implements links:', error);
        });
    }
  }, [context]);
  
  return (
    <>
      {implementsData && (
        <Inline space="space.200" alignBlock="baseline">
          <ProgressBar 
            appearance="success" 
            value={implementsData.completed/implementsData.total} />
          <Text>{implementsData.progress}%</Text>
        </Inline>
      )}
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);