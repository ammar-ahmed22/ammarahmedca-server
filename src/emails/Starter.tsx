import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Tailwind,
  Body,
  Container,
  Heading,
  Section,
  Img,
  Text,
  Row,
  Column,
} from "@react-email/components";

export type ConfirmationCodeProps = {
  previewText: string;
  children: React.ReactNode;
};

const Starter: React.FC<ConfirmationCodeProps> = ({
  previewText = "",
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Img
                src={"https://ammarahmed.ca/LogoIcon.png"}
                width="100"
                height="100"
                alt="ammarahmed.ca logo"
                className="my-0 mx-auto"
              />
            </Section>
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default Starter;
