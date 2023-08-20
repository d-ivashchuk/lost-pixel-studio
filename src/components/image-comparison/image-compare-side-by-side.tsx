import { Box, Flex, Group } from "@mantine/core";

type Props = {
  beforeImage: string;
  afterImage: string;
  differenceImage: string;
};

const ImageCompareSideBySide = ({ beforeImage, afterImage }: Props) => {
  return (
    <Flex>
      <Box
        style={{
          borderRight: "1px dashed grey",
        }}
      >
        <img
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          src={beforeImage}
          alt="Before image"
          loading="lazy"
        />
      </Box>

      <Box
        style={{
          borderLeft: "1px dashed grey",
          position: "relative",
        }}
      >
        <img
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          src={afterImage}
          alt="After image"
          loading="lazy"
        />
      </Box>
    </Flex>
  );
};

export default ImageCompareSideBySide;
