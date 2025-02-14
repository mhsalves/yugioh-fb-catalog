import { AppBar, Toolbar, Typography } from "@mui/material";

interface HeaderProps {
    title: string;
}

function Header(props: HeaderProps) {
    const { title } = props;

    return (
        <AppBar>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>
            </Toolbar>
        </AppBar>
    );
}

export default Header;
