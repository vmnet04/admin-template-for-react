import * as React from "react";
import * as intl from "react-intl-universal";
import * as ReactMarkdown from "react-markdown";
import { Dispatch, Action } from "redux";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { withStyles, Theme, createStyles } from "@material-ui/core/styles";
import { Typography, Button, Fab, MenuItem, Select, Tooltip } from "@material-ui/core";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import { loading } from "@bndynet/dialog";

import { service as resourceService } from "app/service/resource";
import { actions as authActions, getState } from "app/service/auth";
import { actions as globalActions } from "app/service/global";

import { supportedLocales, KEY_LOCALE, getCurrentLocale } from "app/service/locales";
import storage from "app/helpers/storage";

const styles = (theme: Theme) =>
    createStyles({
        "@global": {
            body: {
                paddingTop: theme.spacing.unit * 4,
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.default,
            },
            ".markdown-body a": {
                color: theme.palette.text.primary,
                textDecoration: "underline",
            },
        },
        main: {
            maxWidth: 845,
            marginLeft: "auto",
            marginRight: "auto",
        },
        fab: {
            position: "fixed",
            right: theme.spacing.unit * 2,
            bottom: theme.spacing.unit * 2,
            fontSize: 24,
            fontWeight: 700,
            "&.disabled": {
                color: theme.palette.common.white,
            },
        },
        forkMe: {
            position: "absolute",
            top: 0,
            right: 0,
            border: 0,
        },
    });

interface HomeComponentProps {
    history: any;
    classes: any;
    user: any;
    readme: string;
    onLogout(): void;
    onPreLogout(): void;
}

interface HomeComponentState {
    locale?: string;
    logoutDelay?: number;
    readme?: string;
}

class Home extends React.Component<HomeComponentProps, HomeComponentState> {
    private interval: any;

    constructor(props: HomeComponentProps) {
        super(props);
        this.handleLogin = this.handleLogin.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.state = {
            locale: getCurrentLocale(),
            logoutDelay: null,
            readme: "",
        };
    }

    public componentWillMount() {
        loading();
        resourceService
            .get("/README.md")
            .then((res: any) => {
                this.setState({
                    readme: res,
                });
            })
            .finally(() => {
                loading(false);
            });
    }

    public render() {
        const { classes } = this.props;
        const btn = this.props.user ? (
            <Tooltip title={this.props.user.name}>
                <Fab disabled={!!this.state.logoutDelay} classes={{ root: classes.fab, disabled: "disabled" }} onClick={this.handleLogout} color="secondary">
                    {this.state.logoutDelay && this.state.logoutDelay > 0 ? this.state.logoutDelay : this.props.user.name[0]}
                </Fab>
            </Tooltip>
        ) : (
            <Fab classes={{ root: classes.fab, disabled: "disabled" }} onClick={this.handleLogin} color="primary">
                <AccountCircleIcon />
            </Fab>
        );

        return (
            <div className={classes.body}>
                <a href="https://github.com/bndynet/admin-template-for-react">
                    <img className={classes.forkMe} src="https://s3.amazonaws.com/github/ribbons/forkme_right_red_aa0000.png" alt="Fork me on GitHub" />
                </a>
                <main className={classes.main}>
                    <div className="margin-bottom-2">
                        <Link to="/admin">
                            <Button variant="outlined">
                                <Typography>{intl.get("admin.brand")}</Typography>
                            </Button>
                        </Link>
                        <Select className="margin-left-2" value={this.state.locale} onChange={evt => this.handleChangeLocale(evt)} displayEmpty={true}>
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {supportedLocales.map(locale => (
                                <MenuItem key={locale.value} value={locale.value} selected={this.state.locale === locale.value}>
                                    {locale.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>
                    <ReactMarkdown source={this.state.readme} className={"markdown-body"} />
                    {btn}
                </main>
            </div>
        );
    }

    private handleLogout() {
        this.setState({
            logoutDelay: 5,
        });
        this.props.onPreLogout();
        this.interval = setInterval(() => {
            const delay = this.state.logoutDelay - 1;
            this.setState({
                logoutDelay: delay,
            });
            if (delay <= 0) {
                clearInterval(this.interval);
                this.props.onLogout();
                return;
            }
        }, 1000);
    }

    private handleLogin() {
        this.props.history.push("/login");
    }

    private handleChangeLocale(evt) {
        const locale = evt.target.value;
        if (locale) {
            storage.setCookie(KEY_LOCALE, evt.target.value);
        } else {
            storage.removeCookie(KEY_LOCALE);
        }
        this.setState({
            locale: evt.target.value,
        });
        location.reload();
    }
}

const mapStateToProps = state => ({
    user: getState().user,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>) => ({
    onLogout: () => {
        dispatch(authActions.logout());
    },
    onPreLogout: () => {
        dispatch(
            globalActions.notify({
                message: "Logging out...",
                variant: "info",
                duration: 5000,
                placement: "bottom left",
            }),
        );
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(withStyles(styles)(Home));
