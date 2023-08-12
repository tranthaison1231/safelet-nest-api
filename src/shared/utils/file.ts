export const getFileName = (fileName: string) => {
  return `${new Date().getTime()}.${fileName.split('.').pop()}`;
};
