export type DirectoryPaths = {
  baseline: string;
  current: string;
  difference: string;
};

export function constructSubDirectories(lostPixelDir: string): DirectoryPaths {
  return {
    baseline: `${lostPixelDir}/baseline`,
    current: `${lostPixelDir}/current`,
    difference: `${lostPixelDir}/difference`,
  };
}
